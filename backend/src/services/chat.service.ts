import { config } from '../config/index.js';
import { facilityRepository } from '../repositories/facility.repository.js';
import { alertRepository } from '../repositories/alert.repository.js';
import { predictionRepository } from '../repositories/prediction.repository.js';
import { transferRepository } from '../repositories/transfer.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { AuthenticatedUser } from '../types/index.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class ChatService {
  /**
   * HealthFlow Panda Grounded AI Assistant Pipeline:
   * 1. Strict Role-Scoped Grounding: Query ONLY data authorized for the caller's role.
   *    - ADMIN: Full network-wide operational and facility intelligence.
   *    - HOSPITAL_MANAGER: Strictly their assigned facility's inventory, alerts, predictions, and transfers.
   *    - SUPPLY_MANAGER: Supply requests, active transfers, and logistical movement.
   * 2. Grounded Prompt Formulation: Enforce zero-hallucination boundaries.
   * 3. LLM Call: Handled exclusively on the backend (Gemini API with deterministic fallback).
   */
  async processQuery(prompt: string, history: ChatMessage[], currentUser: AuthenticatedUser) {
    const isHospitalManager = currentUser.role === 'HOSPITAL_MANAGER';
    const isSupplyManager = currentUser.role === 'SUPPLY_MANAGER';
    const isAdmin = currentUser.role === 'ADMIN';

    // 1. Fetch factual operational context strictly scoped to user role
    let contextSummary: any = {};
    let groundingContext: any = {};

    if (isHospitalManager && currentUser.facilityId) {
      const [assignedFacility, facilityAlerts, facilityPredictions, facilityTransfers, facilityInventory] =
        await Promise.all([
          facilityRepository.findById(currentUser.facilityId),
          alertRepository.findByFacility(currentUser.facilityId),
          predictionRepository.findLatestByFacility(currentUser.facilityId),
          transferRepository.findByFacility(currentUser.facilityId),
          inventoryRepository.findByFacility(currentUser.facilityId),
        ]);

      const openAlerts = facilityAlerts.filter((a) => a.status === 'OPEN' || a.status === 'ACKNOWLEDGED');
      const highRisks = facilityPredictions.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL');
      const criticalInventory = facilityInventory.filter(
        (i) => i.quantity <= i.safetyStock || (i.dailyConsumption > 0 && i.quantity / i.dailyConsumption <= 3)
      );

      contextSummary = {
        role: 'HOSPITAL_MANAGER',
        facilityId: currentUser.facilityId,
        facilityName: assignedFacility?.name || 'Assigned Facility',
        facilityType: assignedFacility?.type || 'PHC',
        facilityDistrict: (assignedFacility as any)?.district || 'Central District',
        activeAlertCount: openAlerts.length,
        highRiskItemCount: highRisks.length,
        topHighRisks: highRisks.slice(0, 3).map((p) => ({
          resource: p.resource?.name || p.resourceId,
          risk: p.riskLevel,
          daysRemaining: p.predictedDailyDemand > 0 ? 'Short' : 'Stable',
          explanation: p.explanation,
        })),
        criticalItems: criticalInventory.slice(0, 3).map((i) => ({
          resource: i.resource?.name || 'Resource',
          stock: i.quantity,
          dailyBurn: i.dailyConsumption,
        })),
        transfersCount: facilityTransfers.length,
      };

      groundingContext = {
        facilityName: assignedFacility?.name || 'Your Assigned Facility',
        activeAlertCount: openAlerts.length,
        highRiskItemCount: highRisks.length,
      };
    } else if (isSupplyManager) {
      const [allTransfers, activeAlerts, inventories] = await Promise.all([
        transferRepository.findAll(),
        alertRepository.findAll({ status: 'OPEN' }),
        inventoryRepository.findAll(),
      ]);

      const pendingRequests = allTransfers.filter((t) => t.status === 'REQUESTED');
      const inTransit = allTransfers.filter((t) => t.status === 'IN_TRANSIT');
      const approvedOrPacked = allTransfers.filter((t) => t.status === 'APPROVED' || t.status === 'PACKED');
      const supplyAlerts = activeAlerts.filter(
        (a) =>
          a.type === 'TRANSFER_REQUEST' ||
          a.type === 'TRANSFER_APPROVED' ||
          a.type === 'TRANSFER_COMPLETED' ||
          a.type === 'LOW_STOCK' ||
          a.type === 'STOCKOUT_RISK'
      );

      contextSummary = {
        role: 'SUPPLY_MANAGER',
        pendingRequestsCount: pendingRequests.length,
        inTransitCount: inTransit.length,
        activeOperationsCount: approvedOrPacked.length,
        supplyAlertsCount: supplyAlerts.length,
        samplePendingRequests: pendingRequests.slice(0, 3).map((t: any) => ({
          id: t.id.slice(0, 8),
          resource: t.resource?.name,
          quantity: t.quantity,
          destination: t.destinationFacility?.name,
          priority: t.priority,
        })),
        sampleInTransit: inTransit.slice(0, 3).map((t: any) => ({
          id: t.id.slice(0, 8),
          resource: t.resource?.name,
          destination: t.destinationFacility?.name,
          eta: t.eta,
        })),
      };

      groundingContext = {
        pendingRequestsCount: pendingRequests.length,
        inTransitCount: inTransit.length,
        supplyAlertsCount: supplyAlerts.length,
      };
    } else {
      // ADMIN: Full Network Surveillance
      const [facilityResult, activeAlerts, highRiskPredictions, allTransfers] = await Promise.all([
        facilityRepository.findAll(),
        alertRepository.findAll({ status: 'OPEN' }),
        predictionRepository.findHighRisk(10),
        transferRepository.findAll(),
      ]);

      const facilities = facilityResult.facilities;
      contextSummary = {
        role: 'ADMIN',
        totalFacilities: facilities.length,
        activeAlertCount: activeAlerts.length,
        highRiskCount: highRiskPredictions.length,
        activeTransfersCount: allTransfers.filter((t) => t.status !== 'DELIVERED' && t.status !== 'CANCELLED').length,
        sampleHighRisks: highRiskPredictions.slice(0, 3).map((p) => ({
          facility: p.facility?.name || p.facilityId,
          resource: p.resource?.name || p.resourceId,
          risk: p.riskLevel,
          explanation: p.explanation,
        })),
      };

      groundingContext = {
        totalFacilities: facilities.length,
        activeAlertCount: activeAlerts.length,
        highRiskCount: highRiskPredictions.length,
      };
    }

    // 2. Call Google Gemini if API key configured
    if (config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here') {
      try {
        let roleInstruction = '';
        if (isHospitalManager) {
          roleInstruction = `The user is a Hospital Manager assigned to "${contextSummary.facilityName}".
You must ONLY discuss their assigned facility's inventory, stockout risks, alerts, and transfers.
Do NOT reveal any other facilities, peer rankings, network-wide totals, or global administrator intelligence.
If asked about other facilities or network-wide risk, state clearly that you can only provide data for their assigned facility.`;
        } else if (isSupplyManager) {
          roleInstruction = `The user is a Supply Manager responsible for regional logistics, requests, and transfers.
You must ONLY discuss transfer requests, logistics, delivery statuses, and supply movement.
Do NOT reveal administrative user details, system audit logs, or direct clinical patient intake records.
If asked about clinical facility risk rankings, explain that you can provide operational logistics and transfer metrics.`;
        } else {
          roleInstruction = `The user is a System Administrator with global district surveillance clearance across all facilities.`;
        }

        const systemPrompt = `You are HealthFlow Panda, an intelligent, clinical-grade healthcare resource assistant.
Your motto is: "Predict. Prevent. Protect."
Strict Rule: You must ONLY reference the verified context provided below. Never hallucinate stock or facility metrics.
Role Constraints: ${roleInstruction}
Current System Context: ${JSON.stringify(contextSummary)}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: systemPrompt }, { text: `User Question: ${prompt}` }],
                },
              ],
            }),
          }
        );

        const data = (await response.json()) as any;
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return { reply, groundingContext };
        }
      } catch (err) {
        console.error('Gemini API call failed, falling back to role-scoped deterministic answer:', err);
      }
    }

    // 3. Deterministic Role-Scoped Fallback
    const pLower = prompt.toLowerCase();
    let reply = `Hello! I am HealthFlow Panda, your healthcare resource assistant. `;

    if (isHospitalManager) {
      const facName = contextSummary.facilityName || 'your assigned facility';
      if (pLower.includes('risk') || pLower.includes('highest risk')) {
        const topItem = contextSummary.criticalItems?.[0];
        if (topItem) {
          reply += `In ${facName}, the resource at greatest risk is ${topItem.resource} with currently ${topItem.stock} units remaining against a daily consumption of ${topItem.dailyBurn} units/day. Network-wide facility risk comparisons are restricted to System Administrators.`;
        } else {
          reply += `In ${facName}, inventory levels are currently tracking within safe operational parameters. Cross-facility comparisons are restricted to System Administrators.`;
        }
      } else if (pLower.includes('alert') || pLower.includes('alerts')) {
        reply += `There are currently ${contextSummary.activeAlertCount} active alerts requiring attention at ${facName}.`;
      } else if (pLower.includes('facility') || pLower.includes('facilities')) {
        reply += `You are authorized to monitor and manage your assigned facility: ${facName} (${contextSummary.facilityType}, ${contextSummary.facilityDistrict}).`;
      } else if (pLower.includes('transfer') || pLower.includes('request')) {
        reply += `There are currently ${contextSummary.transfersCount} inbound or outbound transfers associated with ${facName}. You can submit new requests via the Resource Requests tab.`;
      } else {
        reply += `I am monitoring your local facility stock ledgers, burn rates, and pending replenishment transfers for ${facName}. How can I assist you with your facility today?`;
      }
    } else if (isSupplyManager) {
      if (pLower.includes('risk') || pLower.includes('highest risk')) {
        reply += `As a Supply Manager, network-wide clinical risk profiles are restricted to System Administrators. However, I can report that there are ${contextSummary.pendingRequestsCount} pending transfer requests requiring logistics authorization and ${contextSummary.inTransitCount} shipments currently in transit.`;
      } else if (pLower.includes('transfer') || pLower.includes('request') || pLower.includes('pending')) {
        reply += `You have ${contextSummary.pendingRequestsCount} pending transfer requests awaiting authorization and ${contextSummary.inTransitCount} active shipments currently in transit across district transit routes.`;
      } else if (pLower.includes('alert') || pLower.includes('alerts')) {
        reply += `There are currently ${contextSummary.supplyAlertsCount} supply- and logistics-related alerts active across the distribution network.`;
      } else if (pLower.includes('facility') || pLower.includes('facilities')) {
        reply += `You have operational clearance across active district supply nodes to coordinate transfer authorizations, dispatches, and deliveries.`;
      } else {
        reply += `I am tracking regional transfer operations, pending hospital requisitions, and in-transit delivery logistics. How can I assist with supply coordination today?`;
      }
    } else {
      // ADMIN
      if (pLower.includes('risk') || pLower.includes('highest risk')) {
        reply += `Currently, there are ${contextSummary.highRiskCount} resources flagged at HIGH or CRITICAL risk across our monitored network. Top risk: ${contextSummary.sampleHighRisks?.[0]?.explanation || 'Elevated demand detected'}.`;
      } else if (pLower.includes('alert') || pLower.includes('alerts')) {
        reply += `There are currently ${contextSummary.activeAlertCount} unresolved active alerts requiring administrative oversight.`;
      } else if (pLower.includes('facility') || pLower.includes('facilities')) {
        reply += `HealthFlow AI is currently actively monitoring ${contextSummary.totalFacilities} healthcare facilities across the district network.`;
      } else {
        reply += `I am actively monitoring network-wide inventory, predictive risk forecasts, and inter-facility transfers. How can I assist with district health operations today?`;
      }
    }

    return { reply, groundingContext };
  }
}

export const chatService = new ChatService();
