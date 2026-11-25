"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Building2,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Edit,
  Pencil,
  Lock,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  FileText,
  Clock,
  Sparkles,
  Handshake,
  Receipt,
  Boxes,
  Send,
  SlidersHorizontal,
  CreditCard,
  ShoppingCart,
  Percent,
  Check,
  AlertCircle,
  ShieldCheck,
  Printer,
  Download,
  Eye,
  FileCheck,
  Building,
  Copy,
  ExternalLink,
  Upload,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

const KYC_SLOTS = [
  {
    id: "passport",
    title: "Passport Copy / National ID",
    desc: "Primary legal identity verification (valid minimum 6 months)",
    required: true,
  },
  {
    id: "residence_visa",
    title: "Emirates ID / Residence Visa / Permit",
    desc: "Proof of UAE / international residency status",
    required: true,
  },
  {
    id: "proof_of_address",
    title: "Proof of Residential Address",
    desc: "Recent utility bill (DEWA / SEWA) or Ejari tenancy contract within 3 months",
    required: true,
  },
  {
    id: "bank_statement",
    title: "Source of Funds / Bank Statement",
    desc: "Bank statement (last 3-6 months) verifying transaction funds",
    required: true,
  },
  {
    id: "kyc_declaration",
    title: "Signed KYC Declaration & CDD",
    desc: "Anti-Money Laundering & Buyer Due Diligence declaration",
    required: false,
  },
];

const PIPELINE_STAGES = [
  { key: "PROSPECTING", label: "Prospecting" },
  { key: "QUALIFICATION", label: "Qualification" },
  { key: "NEEDS_ANALYSIS", label: "Needs Analysis" },
  { key: "PROPOSAL", label: "Proposal" },
  { key: "NEGOTIATION", label: "Negotiation" },
  { key: "CLOSED_WON", label: "Closed Won" },
];

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { addToast } = useToast();

  const [opp, setOpp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "kyc" | "activities" | "history">("overview");

  // KYC Document Handlers
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  const handleVerifyKycDoc = async (docId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/kyc/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, status }),
      });
      if (res.ok) {
        addToast("success", status === "VERIFIED" ? "Document marked as VERIFIED ✓" : "Document marked as REJECTED");
        fetchOpportunity();
      } else {
        addToast("error", "Failed to update document status");
      }
    } catch {
      addToast("error", "Error updating document");
    }
  };

  const handleInternalKycUpload = async (docType: string, file: File) => {
    if (!file) return;
    setUploadingDocType(docType);
    try {
      const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(file.name);
      let fileData: string;
      let fileName = file.name;
      let fileSize = file.size;
      let mimeType = file.type || "application/octet-stream";

      if (isImage) {
        const compressed = await new Promise<{ fileData: string; fileName: string; fileSize: number; mimeType: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Unable to read image"));
          reader.onload = () => {
            const img = new Image();
            img.onerror = () => {
              resolve({
                fileData: reader.result as string,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || "image/jpeg",
              });
            };
            img.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                let { width, height } = img;
                const maxDim = 1600;
                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                  } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                  }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                  resolve({ fileData: reader.result as string, fileName: file.name, fileSize: file.size, mimeType: file.type || "image/jpeg" });
                  return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
                const base64Len = compressedDataUrl.length - (compressedDataUrl.indexOf(",") + 1);
                resolve({
                  fileData: compressedDataUrl,
                  fileName: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
                  fileSize: Math.round((base64Len * 3) / 4),
                  mimeType: "image/jpeg",
                });
              } catch {
                resolve({ fileData: reader.result as string, fileName: file.name, fileSize: file.size, mimeType: file.type || "image/jpeg" });
              }
            };
            img.src = reader.result as string;
          };
          reader.readAsDataURL(file);
        });
        fileData = compressed.fileData;
        fileName = compressed.fileName;
        fileSize = compressed.fileSize;
        mimeType = compressed.mimeType;
      } else {
        if (file.size > 4.2 * 1024 * 1024) {
          throw new Error("PDF file size exceeds 4.2 MB limit. Please compress scan.");
        }
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Unable to read PDF"));
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch(`/api/kyc/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          fileName,
          fileData,
          fileSize,
          mimeType,
        }),
      });

      let d: any = {};
      try {
        d = await res.json();
      } catch {}

      if (res.ok) {
        addToast("success", "KYC document uploaded successfully!");
        fetchOpportunity();
      } else {
        addToast("error", d?.error || `Upload failed (${res.status})`);
      }
    } catch (err: any) {
      addToast("error", err?.message || "Error uploading document");
    } finally {
      setUploadingDocType(null);
    }
  };

  // Auxiliary dropdown lists
  const [accounts, setAccounts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);

  // Edit Modal State - All Opportunity Fields
  const [showEditModal, setShowEditModal] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [openSections, setOpenSections] = useState({
    info: true,
    allocation: true,
    notes: true,
  });

  const toggleSection = (sec: "info" | "allocation" | "notes") => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleStartInlineEdit = () => {
    setIsInlineEditing(true);
  };

  const handleCancelInlineEdit = () => {
    if (opp) populateEditForm(opp);
    setIsInlineEditing(false);
  };

  const handleSaveInlineEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          buyerId: editForm.buyerId,
          contactId: editForm.contactId || null,
          amount: Number(editForm.amount),
          estimatedValue: Number(editForm.amount),
          budget: editForm.budget ? Number(editForm.budget) : null,
          stage: editForm.stage,
          probability: Number(editForm.probability),
          closeDate: editForm.closeDate || null,
          expectedClosingDate: editForm.closeDate || null,
          propertyType: editForm.propertyType,
          brokerId: editForm.brokerId || null,
          projectId: editForm.projectId || null,
          unitId: editForm.unitId || null,
          assignedAdvisorId: editForm.assignedAdvisorId || null,
          scheduledVisitDate: editForm.scheduledVisitDate ? new Date(editForm.scheduledVisitDate).toISOString() : null,
          paymentMethod: editForm.paymentMethod || null,
          paymentPlan: editForm.paymentPlan || null,
          notes: editForm.notes,
          description: editForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Opportunity updated successfully");
        setIsInlineEditing(false);
        setShowEditModal(false);
        fetchOpportunity();
      } else {
        addToast("error", data.error || "Failed to update opportunity");
      }
    } catch {
      addToast("error", "Error saving opportunity");
    } finally {
      setSavingEdit(false);
    }
  };

  const [editForm, setEditForm] = useState({
    name: "",
    buyerId: "",
    contactId: "",
    amount: "",
    budget: "",
    stage: "PROSPECTING",
    probability: "50",
    closeDate: "",
    propertyType: "APARTMENT",
    brokerId: "",
    projectId: "",
    unitId: "",
    assignedAdvisorId: "",
    scheduledVisitDate: "",
    paymentMethod: "",
    paymentPlan: "",
    notes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // 1. Generate Quotation Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    projectId: "",
    unitId: "",
    basePrice: "0",
    paymentPlan: "60/40",
    validUntil: "",
    notes: "",
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // 2. Price Negotiation Modal State (Supports both % and AED Fixed discount)
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [negotiatingQuote, setNegotiatingQuote] = useState<any>(null);
  const [negotiateForm, setNegotiateForm] = useState({
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discountValue: "10",
    paymentPlan: "60/40",
    notes: "",
  });
  const [submittingNegotiate, setSubmittingNegotiate] = useState(false);

  // 3. EOI & Advance Token Modal State
  const [showEoiModal, setShowEoiModal] = useState(false);
  const [eoiForm, setEoiForm] = useState({
    unitPrice: 0,
    tokenAmount: 100000,
    paymentMethod: "BANK_TRANSFER",
    paymentReference: "",
    preferredPaymentPlan: "60/40",
    notes: "Advance token deposit for unit reservation.",
  });
  const [submittingEoi, setSubmittingEoi] = useState(false);

  // 4. Final Purchase Order (PO) Modal State
  const [showPoModal, setShowPoModal] = useState(false);
  const [poForm, setPoForm] = useState({
    unitPrice: 0,
    discount: 0,
    finalAmount: 0,
    downPayment: 100000,
    paymentPlan: "60/40",
    notes: "Final contract executed upon verified token advance.",
  });
  const [submittingPo, setSubmittingPo] = useState(false);

  // 5. Official PDF Document Modal State (Quotation V1/V2, EOI, PO)
  const [pdfPreview, setPdfPreview] = useState<{
    open: boolean;
    type: "QUOTATION" | "EOI" | "PO";
    data: any;
    version?: number;
  }>({
    open: false,
    type: "QUOTATION",
    data: null,
    version: 1,
  });

  const populateEditForm = (data: any) => {
    let formattedVisit = "";
    if (data.scheduledVisitDate) {
      try {
        const d = new Date(data.scheduledVisitDate);
        formattedVisit = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } catch {
        formattedVisit = "";
      }
    }

    setEditForm({
      name: data.name || "",
      buyerId: data.buyerId || data.buyer?.id || "",
      contactId: data.contactId || data.contact?.id || "",
      amount: (data.amount || data.estimatedValue || 0).toString(),
      budget: (data.budget || data.estimatedValue || 0).toString(),
      stage: data.stage || "PROSPECTING",
      probability: (data.probability ?? 50).toString(),
      closeDate: data.closeDate ? data.closeDate.split("T")[0] : (data.expectedClosingDate ? data.expectedClosingDate.split("T")[0] : ""),
      propertyType: data.propertyType || "APARTMENT",
      brokerId: data.brokerId || data.broker?.id || "",
      projectId: data.projectId || data.project?.id || "",
      unitId: data.unitId || data.unit?.id || "",
      assignedAdvisorId: data.assignedAdvisorId || data.assignedAdvisor?.id || "",
      scheduledVisitDate: formattedVisit,
      paymentMethod: data.paymentMethod || "",
      paymentPlan: data.paymentPlan || "",
      notes: data.notes || data.description || "",
    });
  };

  const fetchOpportunity = async () => {
    try {
      const res = await fetch(`/api/opportunities/${id}`);
      const data = await res.json();
      if (res.ok) {
        setOpp(data.opportunity);
        populateEditForm(data.opportunity);
      } else {
        addToast("error", data.error || "Opportunity not found");
      }
    } catch {
      addToast("error", "Error loading opportunity details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunity();
    fetch("/api/accounts?limit=100").then(r => r.json()).then(d => setAccounts(d.accounts || [])).catch(() => {});
    fetch("/api/contacts?limit=100").then(r => r.json()).then(d => setContacts(d.contacts || [])).catch(() => {});
    fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {});
    fetch("/api/units").then(r => r.json()).then(d => setUnits(d.units || [])).catch(() => {});
    fetch("/api/brokers").then(r => r.json()).then(d => setBrokers(d.brokers || [])).catch(() => {});
    fetch("/api/users").then(r => r.json()).then(d => setAdvisors(d.users || [])).catch(() => {});
  }, [id]);

  const handleUpdateStage = async (newStage: string) => {
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        addToast("success", `Opportunity updated to ${newStage}`);
        fetchOpportunity();
      } else {
        addToast("error", "Failed to update stage");
      }
    } catch {
      addToast("error", "Error updating stage");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          buyerId: editForm.buyerId,
          contactId: editForm.contactId || null,
          amount: Number(editForm.amount),
          estimatedValue: Number(editForm.amount),
          budget: editForm.budget ? Number(editForm.budget) : null,
          stage: editForm.stage,
          probability: Number(editForm.probability),
          closeDate: editForm.closeDate || null,
          expectedClosingDate: editForm.closeDate || null,
          propertyType: editForm.propertyType,
          brokerId: editForm.brokerId || null,
          projectId: editForm.projectId || null,
          unitId: editForm.unitId || null,
          assignedAdvisorId: editForm.assignedAdvisorId || null,
          scheduledVisitDate: editForm.scheduledVisitDate ? new Date(editForm.scheduledVisitDate).toISOString() : null,
          paymentMethod: editForm.paymentMethod || null,
          paymentPlan: editForm.paymentPlan || null,
          notes: editForm.notes,
          description: editForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Opportunity updated successfully");
        setShowEditModal(false);
        fetchOpportunity();
      } else {
        addToast("error", data.error || "Failed to update opportunity");
      }
    } catch {
      addToast("error", "Error saving opportunity");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete opportunity "${opp?.name}"?`)) return;
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("success", "Opportunity deleted");
        router.push("/opportunities");
      } else {
        addToast("error", "Failed to delete opportunity");
      }
    } catch {
      addToast("error", "Error deleting opportunity");
    }
  };

  // ----------------------------------------------------
  // COMMERCIAL FLOW ACTIONS
  // ----------------------------------------------------

  // 1. Open Generate Quotation Modal
  const handleOpenGenerateQuotation = () => {
    const base = opp.unit?.finalPrice || opp.amount || opp.estimatedValue || 2800000;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 15);
    const validUntilStr = defaultDate.toISOString().split("T")[0];

    setQuoteForm({
      projectId: opp.projectId || opp.project?.id || "",
      unitId: opp.unitId || opp.unit?.id || "",
      basePrice: base.toString(),
      paymentPlan: opp.paymentPlan || "60/40",
      validUntil: validUntilStr,
      notes: `Standard commercial quotation prepared for ${opp.buyer?.name || opp.buyer?.companyName || "Client"} for Unit #${opp.unit?.unitNumber || "Selected"}.`,
    });
    setShowQuoteModal(true);
  };

  const handleGenerateQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.unitId) {
      addToast("error", "Please select an allocated unit to generate a quotation.");
      return;
    }
    setSubmittingQuote(true);
    try {
      const base = Number(quoteForm.basePrice);
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: opp.buyerId || opp.buyer?.id,
          projectId: quoteForm.projectId || opp.projectId || opp.project?.id,
          unitId: quoteForm.unitId,
          opportunityId: opp.id,
          basePrice: base,
          floorPremium: 0,
          viewPremium: 0,
          otherFees: 0,
          discount: 0,
          finalPrice: base,
          paymentPlan: quoteForm.paymentPlan,
          validUntil: quoteForm.validUntil,
          notes: quoteForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", `Quotation V1 #${data.quotation?.quotationNumber || ""} generated successfully!`);
        setShowQuoteModal(false);
        setActiveTab("transactions");
        fetchOpportunity();
      } else {
        addToast("error", data.error || "Failed to generate quotation");
      }
    } catch {
      addToast("error", "Error creating quotation");
    } finally {
      setSubmittingQuote(false);
    }
  };

  // 2. Send Quotation Action
  const handleSendQuotation = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotations/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SENT" }),
      });
      if (res.ok) {
        addToast("success", "Quotation formally sent to client with PDF download available! Stage set to Proposal.");
        fetchOpportunity();
      } else {
        addToast("error", "Failed to send quotation");
      }
    } catch {
      addToast("error", "Error sending quotation");
    }
  };

  // 3. Open Price Negotiation Modal (% vs Fixed AED)
  const handleOpenNegotiateModal = (quote: any) => {
    setNegotiatingQuote(quote);
    setNegotiateForm({
      discountType: (quote.discountType as "PERCENTAGE" | "FIXED") || "PERCENTAGE",
      discountValue: quote.discountValue ? quote.discountValue.toString() : "10",
      paymentPlan: quote.paymentPlan || opp.paymentPlan || "60/40",
      notes: quote.notes || "",
    });
    setShowNegotiateModal(true);
  };

  // Live calculation for Price Negotiation
  const calcBasePrice = negotiatingQuote?.basePrice || 0;
  const numDiscountVal = Number(negotiateForm.discountValue) || 0;
  const computedDiscountAmount =
    negotiateForm.discountType === "PERCENTAGE"
      ? (calcBasePrice * numDiscountVal) / 100
      : numDiscountVal;
  const computedFinalPrice = Math.max(0, calcBasePrice - computedDiscountAmount);
  const computedEffectivePercent =
    calcBasePrice > 0 ? ((computedDiscountAmount / calcBasePrice) * 100).toFixed(2) : "0";

  const handleNegotiateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiatingQuote) return;
    setSubmittingNegotiate(true);
    try {
      const res = await fetch(`/api/quotations/${negotiatingQuote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "NEGOTIATION",
          discountType: negotiateForm.discountType,
          discountValue: numDiscountVal,
          discount: computedDiscountAmount,
          finalPrice: computedFinalPrice,
          paymentPlan: negotiateForm.paymentPlan,
          notes: negotiateForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", `Price negotiated! Generated Revised Quotation V2 (Net: AED ${computedFinalPrice.toLocaleString()}). Baseline V1 preserved.`);
        setShowNegotiateModal(false);
        fetchOpportunity();
      } else {
        addToast("error", data.error || "Failed to update price negotiation");
      }
    } catch {
      addToast("error", "Error saving negotiation");
    } finally {
      setSubmittingNegotiate(false);
    }
  };

  // 4. Accept Proposal
  const handleAcceptQuotation = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotations/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });
      if (res.ok) {
        addToast("success", "Quotation marked as ACCEPTED! Proceeding to EOI & Token Advance.");
        fetchOpportunity();
      } else {
        addToast("error", "Failed to accept quotation");
      }
    } catch {
      addToast("error", "Error accepting quotation");
    }
  };

  // 5. Open EOI & Advance Token Modal
  const handleOpenEoiModal = (quote: any) => {
    const agreedPrice = quote?.finalPrice || opp.amount || 2800000;
    const defaultToken = Math.min(100000, agreedPrice * 0.05);

    setEoiForm({
      unitPrice: agreedPrice,
      tokenAmount: defaultToken,
      paymentMethod: opp.paymentMethod === "Bank Transfer" ? "BANK_TRANSFER" : (opp.paymentMethod === "Cash" ? "CASH" : "BANK_TRANSFER"),
      paymentReference: `ADV-TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      preferredPaymentPlan: quote?.paymentPlan || opp.paymentPlan || "60/40",
      notes: `Advance token deposit received for unit reservation. Unit #${opp.unit?.unitNumber || "Selected"}.`,
    });
    setShowEoiModal(true);
  };

  const handleEoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEoi(true);
    try {
      const res = await fetch("/api/eois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: opp.buyerId || opp.buyer?.id,
          opportunityId: opp.id,
          projectId: opp.projectId || opp.project?.id,
          unitId: opp.unitId || opp.unit?.id,
          unitPrice: Number(eoiForm.unitPrice),
          tokenAmount: Number(eoiForm.tokenAmount),
          isRefundable: false,
          paymentMethod: eoiForm.paymentMethod,
          paymentReference: eoiForm.paymentReference,
          paymentStatus: "VERIFIED",
          verifiedAdvance: true,
          preferredPaymentPlan: eoiForm.preferredPaymentPlan,
          notes: eoiForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", `EOI #${data.eoi?.eoiNumber || ""} created & advance verified! Unit marked RESERVED.`);
        setShowEoiModal(false);
        setActiveTab("transactions");
        fetchOpportunity();
      } else {
        addToast("error", data.error || "Failed to create EOI");
      }
    } catch {
      addToast("error", "Error creating EOI");
    } finally {
      setSubmittingEoi(false);
    }
  };

  // 6. Open Final PO Modal
  const handleOpenPoModal = (latestEoi: any, latestQuote: any) => {
    const finalDeal = latestQuote ? latestQuote.finalPrice : (opp.amount || 2800000);
    const unitOriginalPrice = latestQuote ? latestQuote.basePrice : finalDeal;
    const discountTotal = latestQuote ? latestQuote.discount : 0;
    const tokenDepositPaid = latestEoi ? latestEoi.tokenAmount : 100000;

    setPoForm({
      unitPrice: unitOriginalPrice,
      discount: discountTotal,
      finalAmount: finalDeal,
      downPayment: tokenDepositPaid,
      paymentPlan: latestQuote?.paymentPlan || opp.paymentPlan || "60/40",
      notes: `Final purchase order contract executed with down payment of AED ${tokenDepositPaid.toLocaleString()} deducted. Unit sold.`,
    });
    setShowPoModal(true);
  };

  const handlePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPo(true);
    try {
      const latestQuote = opp.quotations?.[0];
      const latestEoi = opp.eois?.[0];

      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: opp.buyerId || opp.buyer?.id,
          projectId: opp.projectId || opp.project?.id,
          unitId: opp.unitId || opp.unit?.id,
          opportunityId: opp.id,
          quotationId: latestQuote?.id || null,
          eoiId: latestEoi?.id || null,
          unitPrice: Number(poForm.unitPrice),
          discount: Number(poForm.discount),
          additionalCharges: 0,
          finalAmount: Number(poForm.finalAmount),
          downPayment: Number(poForm.downPayment),
          paymentPlan: poForm.paymentPlan,
          notes: poForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", `Purchase Order #${data.po?.poNumber || ""} generated! Deal CLOSED WON and Unit marked SOLD!`);
        setShowPoModal(false);
        setActiveTab("transactions");
        fetchOpportunity();
      } else {
        addToast("error", data.error || "Failed to generate Purchase Order");
      }
    } catch {
      addToast("error", "Error creating PO");
    } finally {
      setSubmittingPo(false);
    }
  };

  // Helper for Opening PDF Documents
  const handleOpenPdf = (type: "QUOTATION" | "EOI" | "PO", data: any, version = 1) => {
    setPdfPreview({ open: true, type, data, version });
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400">Loading Opportunity Record...</div>;
  }

  if (!opp) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-600 mb-4">Opportunity not found.</p>
        <Link href="/opportunities" className="text-blue-600 font-semibold hover:underline">
          Return to Opportunities
        </Link>
      </div>
    );
  }

  const accountName = opp.buyer?.name || opp.buyer?.companyName || `${opp.buyer?.firstName || ""} ${opp.buyer?.lastName || ""}`.trim() || "Account";
  const contactName = opp.contact ? `${opp.contact.firstName} ${opp.contact.lastName}` : null;
  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.key === opp.stage);

  // Latest commercial objects & V1 / V2 extraction
  const quotesList = opp.quotations || [];
  const v1Quote = quotesList.find((q: any) => q.version === 1) || (quotesList.length > 1 ? quotesList[quotesList.length - 1] : quotesList[0]);
  const v2Quote = quotesList.find((q: any) => q.version === 2 || q.discount > 0) || (quotesList.length > 1 ? quotesList[0] : null);
  const activeQuote = v2Quote || v1Quote || null;

  const latestEoi = opp.eois?.[0] || null;
  const latestPo = opp.purchaseOrders?.[0] || null;

  return (
    <div className={`space-y-6 ${isInlineEditing ? "pb-24" : ""}`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/opportunities" className="hover:text-blue-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Opportunities
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{opp.name}</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {opp.name}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {opp.opportunityNumber}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {opp.stage}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                <Link
                  href={`/accounts/${opp.buyer?.id}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {accountName}
                </Link>
                {contactName && (
                  <Link
                    href={`/contacts/${opp.contact?.id}`}
                    className="flex items-center gap-1 text-slate-700 hover:text-blue-600"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {contactName}
                  </Link>
                )}
                <span className="font-bold text-slate-800 text-sm">
                  {formatCurrency(opp.amount || opp.estimatedValue || 0)}
                </span>
                <span>Win Prob: <strong>{opp.probability || 50}%</strong></span>
                {opp.assignedAdvisor && (
                  <span>
                    Advisor: <strong>{opp.assignedAdvisor.firstName} {opp.assignedAdvisor.lastName}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons with Contextual Sales Commercial Flow */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* 1. If no quotation exists yet */}
            {!activeQuote && (
              <button
                onClick={handleOpenGenerateQuotation}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Receipt className="w-3.5 h-3.5" />
                Generate Quotation
              </button>
            )}

            {/* 2. If quotation is in DRAFT */}
            {activeQuote && activeQuote.status === "DRAFT" && (
              <button
                onClick={() => handleSendQuotation(activeQuote.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Send Quotation V1 →
              </button>
            )}

            {/* 3. If quotation is SENT or in NEGOTIATION */}
            {activeQuote && (activeQuote.status === "SENT" || activeQuote.status === "NEGOTIATION") && (
              <>
                <button
                  onClick={() => handleOpenNegotiateModal(activeQuote)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Percent className="w-3.5 h-3.5" />
                  Negotiate Price (Generate V2)
                </button>
                <button
                  onClick={() => handleAcceptQuotation(activeQuote.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept Proposal
                </button>
              </>
            )}

            {/* 4. If quotation is ACCEPTED but no EOI yet */}
            {activeQuote && activeQuote.status === "ACCEPTED" && !latestEoi && (
              <button
                onClick={() => handleOpenEoiModal(activeQuote)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Proceed to EOI & Token Advance →
              </button>
            )}

            {/* 5. If EOI exists but no Final PO yet */}
            {latestEoi && !latestPo && (
              <button
                onClick={() => handleOpenPoModal(latestEoi, activeQuote)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Generate Final PO →
              </button>
            )}

            {/* 6. If PO is already created */}
            {latestPo && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                PO #{latestPo.poNumber} (Sold)
              </span>
            )}

            {/* Copy Client KYC Portal Link */}
            <button
              onClick={() => {
                const url = `${window.location.origin}/kyc/${opp.id}`;
                navigator.clipboard.writeText(url);
                addToast("success", "Client KYC Document Portal link copied to clipboard!");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
              title="Copy Client KYC Document Upload Link"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Copy Client KYC Link
            </button>
            <a
              href={`/kyc/${opp.id}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
              title="Open Client Document Portal in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => {
                if (isInlineEditing) {
                  handleCancelInlineEdit();
                } else {
                  handleStartInlineEdit();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
                isInlineEditing
                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                  : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600" />
              {isInlineEditing ? "Discard Changes" : "Edit Deal"}
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Opportunity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Salesforce Stage Stepper */}
        <div className="pt-4 border-t border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Pipeline Stage Progression
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
            {PIPELINE_STAGES.map((s, idx) => {
              const isPast = currentStageIndex > idx;
              const isCurrent = opp.stage === s.key;

              return (
                <button
                  key={s.key}
                  onClick={() => handleUpdateStage(s.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : isPast
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {isPast ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : null}
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          All Fields Overview
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "transactions"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Quotations, EOI & PO
          <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 text-slate-600 font-normal">
            {(opp.quotations?.length || 0) + (opp.eois?.length || 0) + (opp.purchaseOrders?.length || 0)}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("kyc")}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "kyc"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          KYC Documents
          <span className="px-1.5 py-0.2 rounded-full text-xs bg-blue-100 text-blue-700 font-bold">
            {opp.documents?.filter((d: any) => d.category === "KYC")?.length || 0}/5
          </span>
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "activities"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Activity Timeline
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "history"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Stage History
        </button>
      </div>

      {/* Tab 1: All Fields Overview — Salesforce Lightning Inline Editable Layout */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Section 1: Opportunity Information */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <button
              type="button"
              onClick={() => toggleSection("info")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.info ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Opportunity Information
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                {isInlineEditing ? "Direct inline editing enabled" : "Click pencil icon to edit in place"}
              </span>
            </button>

            {openSections.info && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-2 sm:p-4">
                {/* Left Column */}
                <div className="space-y-1 md:pr-4">
                  {/* Opportunity Name */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2 flex items-center gap-1">
                      {isInlineEditing && <span className="text-red-500 font-bold">*</span>}
                      Opportunity Name
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Deal Name"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-900 text-xs truncate">{opp.name}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Opportunity Name"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Account (Buyer) */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2 flex items-center gap-1">
                      {isInlineEditing && <span className="text-red-500 font-bold">*</span>}
                      Account
                    </div>
                    {isInlineEditing ? (
                      <select
                        required
                        value={editForm.buyerId}
                        onChange={(e) => setEditForm({ ...editForm, buyerId: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="">-- Select Buyer Account --</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name || acc.companyName || `${acc.firstName || ""} ${acc.lastName || ""}`.trim() || acc.accountNumber}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <Link href={`/accounts/${opp.buyer?.id}`} className="font-semibold text-blue-600 text-xs hover:underline truncate">
                          {accountName}
                        </Link>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Account"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Designated Contact */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Designated Contact
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.contactId}
                        onChange={(e) => setEditForm({ ...editForm, contactId: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="">-- None / Unassigned --</option>
                        {contacts
                          .filter((c) => !editForm.buyerId || c.buyerAccountId === editForm.buyerId || c.accountId === editForm.buyerId || c.id === editForm.contactId)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ""}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">{contactName || "None assigned"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Contact"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Referring Broker */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Referring Broker
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.brokerId}
                        onChange={(e) => setEditForm({ ...editForm, brokerId: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="">-- Select Broker --</option>
                        {brokers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}{b.contactPerson && b.contactPerson !== b.name ? ` (${b.contactPerson})` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">
                          {opp.broker ? opp.broker.name : "None assigned"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Broker"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Deal Amount */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Deal Amount (AED)
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        placeholder="2800000"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs font-semibold"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-bold text-blue-600 text-xs truncate">
                          {formatCurrency(opp.amount || opp.estimatedValue || 0)}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Deal Amount"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Client Budget */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Client Budget (AED)
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="number"
                        value={editForm.budget}
                        onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                        placeholder="3000000"
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-800 text-xs truncate">
                          {formatCurrency(opp.budget || opp.estimatedValue || 0)}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Client Budget"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-1 md:pl-4">
                  {/* Pipeline Stage */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Pipeline Stage
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.stage}
                        onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs font-medium"
                      >
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                        <option value="CLOSED_LOST">Closed Lost</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {opp.stage}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Pipeline Stage"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Win Probability */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Win Probability (%)
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.probability}
                        onChange={(e) => setEditForm({ ...editForm, probability: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-800 text-xs">{opp.probability || 50}%</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Probability"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expected Close Date */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Expected Close Date
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="date"
                        value={editForm.closeDate}
                        onChange={(e) => setEditForm({ ...editForm, closeDate: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs">
                          {formatDate(opp.closeDate || opp.expectedClosingDate)}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Close Date"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Property Type */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Property Type
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.propertyType}
                        onChange={(e) => setEditForm({ ...editForm, propertyType: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="APARTMENT">Apartment</option>
                        <option value="PENTHOUSE">Penthouse</option>
                        <option value="VILLA">Villa</option>
                        <option value="TOWNHOUSE">Townhouse</option>
                        <option value="COMMERCIAL">Commercial Office</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-800 text-xs">{opp.propertyType || "APARTMENT"}</span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Property Type"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Opportunity Reference (Read-only) */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Opportunity Ref
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="font-mono text-slate-700 text-xs">{opp.opportunityNumber}</span>
                      <span className="text-slate-300" title="System calculated upon save">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Created On (Read-only) */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Created On
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-slate-700 text-xs">{formatDate(opp.createdAt)}</span>
                      <span className="text-slate-300" title="System timestamp">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Project & Inventory Allocation */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <button
              type="button"
              onClick={() => toggleSection("allocation")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.allocation ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Project & Inventory Allocation
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Development, unit assignment & payment plans
              </span>
            </button>

            {openSections.allocation && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-2 sm:p-4">
                {/* Left Column */}
                <div className="space-y-1 md:pr-4">
                  {/* Project Development */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Project Development
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.projectId}
                        onChange={(e) => setEditForm({ ...editForm, projectId: e.target.value, unitId: "" })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="">-- None / General Inquiry --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-800 text-xs truncate">
                          {opp.project?.name ? `${opp.project.name} (${opp.project.code})` : "Azure Marina Residences (AMR)"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Project"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Allocated Unit */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Allocated Unit
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.unitId}
                        onChange={(e) => setEditForm({ ...editForm, unitId: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="">Pending Shortlisting / None</option>
                        {units
                          .filter(
                            (u) =>
                              (!editForm.projectId || u.projectId === editForm.projectId) &&
                              (u.status === "AVAILABLE" || u.id === editForm.unitId || u.id === opp.unitId)
                          )
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              Unit #{u.unitNumber} {u.building?.name ? `(${u.building.name})` : ""} - AED {u.finalPrice?.toLocaleString() || "N/A"}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-800 text-xs truncate">
                          {opp.unit ? `Unit #${opp.unit.unitNumber} ${opp.unit.building?.name ? `(${opp.unit.building.name})` : ""} - AED ${opp.unit.finalPrice?.toLocaleString() || "N/A"}` : "Pending Shortlisting"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Allocated Unit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Scheduled Unit Visit */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Scheduled Unit Visit (Viewing Slot)
                    </div>
                    {isInlineEditing ? (
                      <input
                        type="datetime-local"
                        value={editForm.scheduledVisitDate}
                        onChange={(e) => setEditForm({ ...editForm, scheduledVisitDate: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-blue-700 text-xs truncate">
                          {opp.scheduledVisitDate
                            ? new Date(opp.scheduledVisitDate).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                            : "Not Scheduled"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Scheduled Visit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-1 md:pl-4">
                  {/* Payment Method / Financing */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Payment Method
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.paymentMethod}
                        onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="">-- Select Payment Method --</option>
                        <option value="CASH">Cash (100% Equity)</option>
                        <option value="MORTGAGE_BANK">Mortgage / Bank Loan</option>
                        <option value="DEVELOPER_PLAN">Developer Payment Plan</option>
                        <option value="CASH_MORTGAGE">Cash + Mortgage Loan</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">
                          {opp.paymentMethod || "Not Selected"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Payment Method"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payment Plan Structure */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Payment Plan
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.paymentPlan}
                        onChange={(e) => setEditForm({ ...editForm, paymentPlan: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs font-mono"
                      >
                        <option value="">-- Select Plan --</option>
                        <option value="20/80">20/80 (Standard)</option>
                        <option value="60/40">60/40 (Post-Handover)</option>
                        <option value="50/50">50/50 (Equal Tranche)</option>
                        <option value="30/70">30/70</option>
                        <option value="40/60">40/60</option>
                        <option value="10/90">10/90 (High Leverage)</option>
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-semibold text-blue-700 text-xs font-mono truncate">
                          {opp.paymentPlan || "Not Selected"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Payment Plan"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sales Owner / Advisor */}
                  <div className="border-b border-slate-100 py-2 px-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between group min-h-[46px]">
                    <div className="text-xs font-medium text-slate-500 w-[38%] shrink-0 pr-2">
                      Advisor / Owner
                    </div>
                    {isInlineEditing ? (
                      <select
                        value={editForm.assignedAdvisorId}
                        onChange={(e) => setEditForm({ ...editForm, assignedAdvisorId: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                      >
                        <option value="">-- Unassigned --</option>
                        {advisors.map((adv) => (
                          <option key={adv.id} value={adv.id}>
                            {adv.firstName} {adv.lastName} ({adv.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="font-medium text-slate-800 text-xs truncate">
                          {opp.assignedAdvisor
                            ? `${opp.assignedAdvisor.firstName} ${opp.assignedAdvisor.lastName}`
                            : "Unassigned"}
                        </span>
                        <button
                          type="button"
                          onClick={handleStartInlineEdit}
                          className="p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                          title="Edit Advisor"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Description & Deal Notes */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <button
              type="button"
              onClick={() => toggleSection("notes")}
              className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSections.notes ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Description & Deal Notes
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Customer requirements, special terms & specifications
              </span>
            </button>

            {openSections.notes && (
              <div className="p-4 group">
                {isInlineEditing ? (
                  <textarea
                    rows={4}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Document client preferences, unit specifications, purchasing timeline or negotiation details..."
                    className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 leading-relaxed shadow-xs"
                  />
                ) : (
                  <div className="relative">
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 whitespace-pre-line">
                      {opp.notes || opp.description || "No specific deal notes logged."}
                    </p>
                    <button
                      type="button"
                      onClick={handleStartInlineEdit}
                      className="absolute top-2 right-2 p-1 text-slate-300 hover:text-blue-600 group-hover:text-slate-500 rounded transition-colors"
                      title="Edit Description"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Commercial Flow (Quotation -> Price Negotiation -> EOI -> Final PO) */}
      {activeTab === "transactions" && (
        <div className="space-y-6">
          {/* Visual Sales Pipeline Stage Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Commercial Deal Progression: Quotation → Negotiation → EOI Advance → Final PO
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className={`p-3 rounded-lg border flex items-center gap-3 ${activeQuote ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${activeQuote ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                  1
                </div>
                <div>
                  <div className="font-bold">Quotation V1</div>
                  <div className="text-[11px]">{activeQuote ? `Status: ${activeQuote.status}` : "Pending Generation"}</div>
                </div>
              </div>

              <div className={`p-3 rounded-lg border flex items-center gap-3 ${v2Quote ? "bg-blue-50 border-blue-200 text-blue-800" : (activeQuote ? "bg-white border-slate-200 text-slate-700" : "bg-slate-50 border-slate-200 text-slate-400")}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${v2Quote ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                  2
                </div>
                <div>
                  <div className="font-bold">Negotiation V2</div>
                  <div className="text-[11px]">
                    {v2Quote ? `Saved ${formatCurrency(v2Quote.discount)} (${v2Quote.discountValue}%)` : "Both % & AED ready"}
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg border flex items-center gap-3 ${latestEoi ? "bg-blue-50 border-blue-200 text-blue-800" : (activeQuote?.status === "ACCEPTED" ? "bg-white border-blue-200 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-400")}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${latestEoi ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                  3
                </div>
                <div>
                  <div className="font-bold">EOI & Token Advance</div>
                  <div className="text-[11px]">{latestEoi ? `Deposit: ${formatCurrency(latestEoi.tokenAmount)}` : "Awaiting Acceptance"}</div>
                </div>
              </div>

              <div className={`p-3 rounded-lg border flex items-center gap-3 ${latestPo ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${latestPo ? "bg-white text-blue-600" : "bg-slate-200 text-slate-600"}`}>
                  4
                </div>
                <div>
                  <div className="font-bold">Final PO Contract</div>
                  <div className="text-[11px]">{latestPo ? `PO #${latestPo.poNumber} (Sold)` : "Final Order"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Quotations */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  1. Quotations ({quotesList.length})
                </h3>
                <p className="text-xs text-slate-500">Commercial quotation, proposal issuance and price discount negotiation</p>
              </div>
              <button
                onClick={handleOpenGenerateQuotation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Receipt className="w-3.5 h-3.5" />
                + Generate New Quotation
              </button>
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              {(!quotesList || quotesList.length === 0) ? (
                <div className="py-10 text-center space-y-3">
                  <p className="text-slate-400">No formal quotation generated for this opportunity yet.</p>
                  <button
                    onClick={handleOpenGenerateQuotation}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Generate Commercial Quotation Now
                  </button>
                </div>
              ) : (
                quotesList.map((q: any) => {
                  const isV2 = q.version === 2 || q.discount > 0;
                  return (
                    <div key={q.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            Quotation #{q.quotationNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                            isV2 ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {isV2 ? "VERSION 2 (REVISED)" : "VERSION 1 (INITIAL)"}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            q.status === "ACCEPTED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : q.status === "SENT" || q.status === "NEGOTIATION"
                              ? "bg-slate-100 text-slate-800 border-slate-300"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {q.status}
                          </span>
                          {q.paymentPlan && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-mono text-[11px]">
                              Plan: {q.paymentPlan}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-xs flex items-center gap-4 flex-wrap">
                          <span>Issued: {formatDate(q.createdAt)}</span>
                          {q.validUntil && <span>Valid Until: {formatDate(q.validUntil)}</span>}
                          <span>Unit: <strong>#{opp.unit?.unitNumber || "N/A"}</strong></span>
                        </div>
                        {q.notes && <p className="text-slate-600 italic mt-1 text-[11px]">{q.notes}</p>}
                      </div>

                      <div className="flex flex-col md:items-end gap-2 shrink-0">
                        <div className="text-right">
                          {q.discount > 0 ? (
                            <div className="space-y-0.5">
                              <span className="text-slate-400 line-through text-xs block">
                                Base: {formatCurrency(q.basePrice)}
                              </span>
                              <span className="text-blue-700 font-bold text-base block">
                                Net: {formatCurrency(q.finalPrice)}
                              </span>
                              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                                Discount: -{formatCurrency(q.discount)} ({q.discountType === "PERCENTAGE" ? `${q.discountValue}%` : "Fixed AED"})
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900 text-base block">
                              {formatCurrency(q.finalPrice || q.basePrice)}
                            </span>
                          )}
                        </div>

                        {/* Row Action Buttons with PDF DOWNLOAD / VIEW */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap justify-end">
                          <button
                            onClick={() => handleOpenPdf("QUOTATION", q, q.version || (isV2 ? 2 : 1))}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-2xs"
                          >
                            <Printer className="w-3 h-3 text-blue-600" />
                            Quotation PDF
                          </button>

                          {q.status === "DRAFT" && (
                            <button
                              onClick={() => handleSendQuotation(q.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
                            >
                              <Send className="w-3 h-3" />
                              Send to Buyer
                            </button>
                          )}

                          {(q.status === "SENT" || q.status === "NEGOTIATION") && (
                            <>
                              <button
                                onClick={() => handleOpenNegotiateModal(q)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-md text-xs font-semibold"
                              >
                                <Percent className="w-3 h-3" />
                                Negotiate Price
                              </button>
                              <button
                                onClick={() => handleAcceptQuotation(q.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
                              >
                                <Check className="w-3 h-3" />
                                Accept Proposal
                              </button>
                            </>
                          )}

                          {q.status === "ACCEPTED" && !latestEoi && (
                            <button
                              onClick={() => handleOpenEoiModal(q)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
                            >
                              <CreditCard className="w-3 h-3" />
                              Proceed to EOI & Token Advance →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Generated Quotation Files & Downloads (V1 & V2) */}
            {(v1Quote || v2Quote) && (
              <div className="bg-slate-50/70 border-t border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Quotation Official Documents (PDF)
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                    {(v1Quote ? 1 : 0) + (v2Quote ? 1 : 0)} Quotation File{((v1Quote ? 1 : 0) + (v2Quote ? 1 : 0)) > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {v1Quote && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate text-xs">Quotation V1 (Initial Offer)</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              V1
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            Base: {formatCurrency(v1Quote.basePrice)} • Plan: {v1Quote.paymentPlan || "20/80"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenPdf("QUOTATION", v1Quote, 1)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                        title="View & Download Quotation V1 PDF"
                      >
                        <Download className="w-3 h-3" />
                        PDF V1
                      </button>
                    </div>
                  )}

                  {v2Quote && (
                    <div className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-all flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Percent className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate text-xs">Quotation V2 (Negotiated Offer)</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white">
                              V2 REVISED
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-700 font-semibold truncate mt-0.5">
                            Net: {formatCurrency(v2Quote.finalPrice)} (-{formatCurrency(v2Quote.discount)})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenPdf("QUOTATION", v2Quote, 2)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                        title="View & Download Quotation V2 PDF"
                      >
                        <Download className="w-3 h-3" />
                        PDF V2
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: EOI & Token Advance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  2. Expression of Interest (EOI) & Token Advance ({opp.eois?.length || 0})
                </h3>
                <p className="text-xs text-slate-500">Unit reservation and verified advance token deposit payment</p>
              </div>
              {activeQuote && activeQuote.status === "ACCEPTED" && (
                <button
                  onClick={() => handleOpenEoiModal(activeQuote)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  + Record Token Advance
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              {(!opp.eois || opp.eois.length === 0) ? (
                <div className="py-8 text-center text-slate-400">
                  {activeQuote?.status === "ACCEPTED" ? (
                    <div className="space-y-2">
                      <p>Quotation accepted! Ready to collect token advance deposit.</p>
                      <button
                        onClick={() => handleOpenEoiModal(activeQuote)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Record Token Advance Deposit
                      </button>
                    </div>
                  ) : (
                    "Quotation must be accepted before issuing EOI and collecting token advance deposit."
                  )}
                </div>
              ) : (
                opp.eois.map((e: any) => (
                  <div key={e.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">EOI #{e.eoiNumber}</span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {e.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Payment: {e.paymentStatus}
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs flex items-center gap-4 flex-wrap">
                        <span>Submitted: {formatDate(e.eoiDate || e.createdAt)}</span>
                        <span>Method: <strong>{e.paymentMethod || "Bank Transfer"}</strong></span>
                        {e.paymentReference && <span>Ref: <strong className="font-mono">{e.paymentReference}</strong></span>}
                      </div>
                      {e.notes && <p className="text-slate-600 italic text-[11px]">{e.notes}</p>}
                    </div>

                    <div className="flex flex-col md:items-end gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-slate-500 text-xs block">Advance Token Paid</span>
                        <span className="font-bold text-blue-600 text-base block">
                          {formatCurrency(e.tokenAmount)}
                        </span>
                        <span className="text-[11px] text-slate-500">Unit Price: {formatCurrency(e.unitPrice)}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleOpenPdf("EOI", e)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-2xs"
                        >
                          <Printer className="w-3 h-3 text-blue-600" />
                          EOI PDF
                        </button>
                        {!latestPo && (
                          <button
                            onClick={() => handleOpenPoModal(e, activeQuote)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Generate Final PO →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* EOI Official Document & Receipt PDF */}
            {latestEoi && (
              <div className="bg-slate-50/70 border-t border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    EOI Official Reservation Document & Payment Receipt (PDF)
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                    1 EOI File Ready
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate text-xs">EOI Reservation & Deposit Receipt</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          EOI #{latestEoi.eoiNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Token Paid: {formatCurrency(latestEoi.tokenAmount)} • Method: {latestEoi.paymentMethod || "Bank Transfer"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenPdf("EOI", latestEoi)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                    title="View & Download EOI Agreement PDF"
                  >
                    <Download className="w-3 h-3" />
                    EOI PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Final Purchase Orders */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  3. Final Purchase Orders (PO) ({opp.purchaseOrders?.length || 0})
                </h3>
                <p className="text-xs text-slate-500">Binding purchase agreements with advance token deducted</p>
              </div>
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              {(!opp.purchaseOrders || opp.purchaseOrders.length === 0) ? (
                <div className="py-8 text-center text-slate-400">
                  {latestEoi ? (
                    <div className="space-y-2">
                      <p>Token advance confirmed! Ready to execute final Purchase Order.</p>
                      <button
                        onClick={() => handleOpenPoModal(latestEoi, activeQuote)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Execute Purchase Order Contract Now
                      </button>
                    </div>
                  ) : (
                    "No purchase orders executed yet."
                  )}
                </div>
              ) : (
                opp.purchaseOrders.map((po: any) => (
                  <div key={po.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">Purchase Order #{po.poNumber}</span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-600 text-white">
                          {po.status || "APPROVED"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px]">
                          Plan: {po.paymentPlan || "Construction Linked"}
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs flex items-center gap-4 flex-wrap">
                        <span>Contract Date: {formatDate(po.createdAt)}</span>
                        <span>Allocated Unit: <strong>#{opp.unit?.unitNumber || "N/A"}</strong></span>
                        <span className="text-blue-700 font-semibold">Deal Won (100% Probability)</span>
                      </div>
                      {po.notes && <p className="text-slate-600 italic text-[11px]">{po.notes}</p>}
                    </div>

                    <div className="flex flex-col md:items-end gap-2 shrink-0">
                      <div className="text-right shrink-0 space-y-1">
                        <span className="text-slate-500 text-xs block">Final Deal Value</span>
                        <span className="font-bold text-slate-900 text-base block">
                          {formatCurrency(po.finalAmount)}
                        </span>
                        <div className="text-[11px] text-slate-600 space-x-2">
                          <span>Advance Deducted: <strong className="text-blue-700">{formatCurrency(po.downPayment || 0)}</strong></span>
                          <span>•</span>
                          <span>Balance Payable: <strong>{formatCurrency(Math.max(0, po.finalAmount - (po.downPayment || 0)))}</strong></span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={() => handleOpenPdf("PO", po)}
                          className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-2xs"
                        >
                          <Printer className="w-3 h-3 text-blue-600" />
                          PO Contract PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Purchase Order Contract PDF */}
            {latestPo && (
              <div className="bg-slate-50/70 border-t border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Final Purchase Order Contract Agreement (PDF)
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                    1 PO Contract Ready
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate text-xs">Final Purchase Order (Contract)</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white">
                          PO #{latestPo.poNumber} SOLD
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Deal Value: {formatCurrency(latestPo.finalAmount)} • Balance: {formatCurrency(Math.max(0, latestPo.finalAmount - (latestPo.downPayment || 0)))}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenPdf("PO", latestPo)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                    title="View & Download Purchase Order Contract PDF"
                  >
                    <Download className="w-3 h-3" />
                    PO PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2.5: KYC Documents Portal & Verification */}
      {activeTab === "kyc" && (
        <div className="space-y-6">
          {/* Client KYC Portal Share Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 rounded-2xl border border-blue-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Client Document Collection Portal Link
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Public Portal Active
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl">
                Send this link directly to the client via WhatsApp, Email or SMS. The client can open it on mobile or desktop to upload their KYC documents (Passport, Visa, Proof of Address, Bank Statement). All uploaded files will appear below automatically.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/kyc/${opp.id}`;
                  navigator.clipboard.writeText(url);
                  addToast("success", "Client KYC link copied to clipboard!");
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Link for Client
              </button>
              <a
                href={`/kyc/${opp.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                Open Portal
              </a>
            </div>
          </div>

          {/* KYC Checklist Status Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  KYC Verification & Document Vault (5 Items)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review submitted client documents or upload on their behalf.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  Compliance Progress:
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {opp.documents?.filter((d: any) => d.category === "KYC").length || 0} / 5 Collected
                </span>
              </div>
            </div>

            {/* Document Slots */}
            <div className="space-y-3.5 pt-1">
              {KYC_SLOTS.map((slot, index) => {
                const uploadedDoc = opp.documents?.find(
                  (d: any) => d.category === "KYC" && (d.docType === slot.id || d.fileName?.includes(slot.id))
                );
                const isUploaded = Boolean(uploadedDoc);

                return (
                  <div
                    key={slot.id}
                    className={`rounded-xl border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isUploaded
                        ? uploadedDoc.status === "VERIFIED"
                          ? "bg-emerald-50/20 border-emerald-200 shadow-2xs"
                          : "bg-blue-50/20 border-blue-200 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isUploaded
                            ? uploadedDoc.status === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                              : "bg-blue-100 text-blue-700 border-blue-300"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {isUploaded ? (
                          uploadedDoc.status === "VERIFIED" ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-700" />
                          ) : (
                            <FileCheck className="w-5 h-5 text-blue-700" />
                          )
                        ) : (
                          <span className="font-bold text-xs">{index + 1}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {slot.title}
                          </h5>
                          {slot.required ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                              Optional
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isUploaded
                                ? uploadedDoc.status === "VERIFIED"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-blue-100 text-blue-800 border-blue-300"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {isUploaded
                              ? uploadedDoc.status === "VERIFIED"
                                ? "Verified ✓"
                                : "Uploaded (Pending Review)"
                              : "Pending Client Upload"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">{slot.desc}</p>

                        {isUploaded && (
                          <div className="mt-2 text-[11px] text-slate-700 flex items-center gap-3 bg-white/80 p-2 rounded-lg border border-slate-200">
                            <span className="font-semibold truncate max-w-[260px]">
                              📎 {uploadedDoc.originalName}
                            </span>
                            <span className="text-slate-400">
                              ({Math.round((uploadedDoc.fileSize || 0) / 1024)} KB)
                            </span>
                            <span className="text-slate-400">
                              • {formatDate(uploadedDoc.createdAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-2 flex-wrap">
                      {isUploaded && (uploadedDoc.fileUrl || uploadedDoc.filePath || uploadedDoc.id) && (
                        <a
                          href={uploadedDoc.fileUrl || `/api/kyc/files/${uploadedDoc.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          View Document
                        </a>
                      )}

                      {isUploaded && uploadedDoc.status !== "VERIFIED" && (
                        <button
                          type="button"
                          onClick={() => handleVerifyKycDoc(uploadedDoc.id, "VERIFIED")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Verify
                        </button>
                      )}

                      {isUploaded && uploadedDoc.status === "VERIFIED" && (
                        <button
                          type="button"
                          onClick={() => handleVerifyKycDoc(uploadedDoc.id, "REJECTED")}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 font-semibold text-xs transition-colors"
                        >
                          Reject
                        </button>
                      )}

                      {/* Upload on behalf of client button */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={uploadingDocType === slot.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleInternalKycUpload(slot.id, file);
                          }}
                          className="hidden"
                        />
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                            isUploaded
                              ? "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingDocType === slot.id
                            ? "Uploading..."
                            : isUploaded
                            ? "Replace"
                            : "Upload File"}
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Activities */}
      {activeTab === "activities" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Activity Timeline</h3>
          <div className="space-y-3 pt-2">
            {!opp.activities || opp.activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recorded activity history yet.</p>
            ) : (
              opp.activities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{act.subject}</p>
                      <span className="text-slate-400 text-[10px]">{formatDate(act.createdAt)}</span>
                    </div>
                    {act.description && <p className="text-slate-600 mt-1">{act.description}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Stage History */}
      {activeTab === "history" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Stage History Log</h3>
          <div className="space-y-3 pt-2">
            {!opp.stageHistory || opp.stageHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No stage changes recorded yet.</p>
            ) : (
              opp.stageHistory.map((h: any) => (
                <div key={h.id} className="p-3 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">
                      {h.fromStage} → <span className="text-blue-600">{h.toStage}</span>
                    </span>
                    {h.notes && <p className="text-slate-500 mt-0.5">{h.notes}</p>}
                  </div>
                  <span className="text-slate-400 text-[10px] font-mono">{formatDate(h.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: OFFICIAL PDF DOCUMENT VIEWER (PRINTABLE & DOWNLOADABLE)         */}
      {/* ---------------------------------------------------------------------- */}
      {pdfPreview.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto print:max-h-none print:w-full print:border-none print:shadow-none">
            {/* Modal Controls (Hidden when printing) */}
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {pdfPreview.type === "QUOTATION" && `Official Quotation PDF (Version ${pdfPreview.version || 1})`}
                  {pdfPreview.type === "EOI" && "Official Expression of Interest (EOI) & Deposit Receipt"}
                  {pdfPreview.type === "PO" && "Official Purchase Order (PO Contract)"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setPdfPreview({ open: false, type: "QUOTATION", data: null })}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 text-base font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="p-8 space-y-6 text-xs text-slate-800 font-sans print:p-4">
              {/* Official Corporate Header */}
              <div className="flex items-start justify-between border-b-2 border-blue-600 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                      P
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900">
                      PENTACLOUD PROPERTIES
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Licensed Real Estate Developer & Escrow Asset Management
                  </p>
                  <p className="text-[10px] text-slate-400">DIFC Gate Towers, Level 14, Dubai, UAE • Reg: RERA #99241</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold font-mono text-xs border border-blue-200">
                    {pdfPreview.type === "QUOTATION" && `QUOTATION ${pdfPreview.data?.quotationNumber || ""}`}
                    {pdfPreview.type === "EOI" && `EOI #${pdfPreview.data?.eoiNumber || ""}`}
                    {pdfPreview.type === "PO" && `PURCHASE ORDER #${pdfPreview.data?.poNumber || ""}`}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Document Date: {formatDate(pdfPreview.data?.createdAt || new Date().toISOString())}
                  </p>
                  <p className="text-[10px] text-blue-600 font-semibold">
                    {pdfPreview.type === "QUOTATION" && (pdfPreview.version === 2 ? "STATUS: REVISED COMMERCIAL OFFER (V2)" : "STATUS: INITIAL COMMERCIAL PROPOSAL (V1)")}
                    {pdfPreview.type === "EOI" && "STATUS: VERIFIED TOKEN ADVANCE"}
                    {pdfPreview.type === "PO" && "STATUS: LEGALLY BINDING PURCHASE AGREEMENT"}
                  </p>
                </div>
              </div>

              {/* Stakeholders & Allocation 2-Column Ledger */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Client / Purchasing Entity
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{accountName}</p>
                  <p className="text-slate-500 text-[11px]">Designated Account: {opp.buyer?.accountNumber || "ACC-01"}</p>
                  {contactName && <p className="text-slate-600 text-[11px]">Contact Person: {contactName}</p>}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Property Asset & Project
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    Unit #{opp.unit?.unitNumber || "MTE-0101"} ({opp.propertyType || "Apartment"})
                  </p>
                  <p className="text-slate-500 text-[11px]">Development: {opp.project?.name || "Azure Marina Residences"}</p>
                  <p className="text-slate-600 text-[11px]">Payment Plan: {pdfPreview.data?.paymentPlan || opp.paymentPlan || "20/80"}</p>
                </div>
              </div>

              {/* TYPE-SPECIFIC FINANCIAL STATEMENT */}
              {pdfPreview.type === "QUOTATION" && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Financial Line Item</th>
                          <th className="px-4 py-2.5 text-right">Amount (AED)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        <tr>
                          <td className="px-4 py-2 text-slate-700">Base Unit Purchase Price</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(pdfPreview.data?.basePrice || 0)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-slate-700">Floor & Elevation Premium</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(pdfPreview.data?.floorPremium || 0)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-slate-700">View & Orientation Premium</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(pdfPreview.data?.viewPremium || 0)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-slate-700">DLD Land Registration & Administrative Fees</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(pdfPreview.data?.otherFees || 0)}</td>
                        </tr>
                        {(pdfPreview.data?.discount > 0 || pdfPreview.version === 2) && (
                          <tr className="bg-blue-50/50">
                            <td className="px-4 py-2 text-blue-700 font-semibold">
                              Negotiated Commercial Discount ({pdfPreview.data?.discountType === "PERCENTAGE" ? `${pdfPreview.data?.discountValue}%` : "Fixed AED"})
                            </td>
                            <td className="px-4 py-2 text-right text-blue-700 font-bold">
                              - {formatCurrency(pdfPreview.data?.discount || 0)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-blue-50 font-bold text-sm">
                          <td className="px-4 py-3 text-slate-900">Total Net Investment Proposal</td>
                          <td className="px-4 py-3 text-right text-blue-700">
                            {formatCurrency(pdfPreview.data?.finalPrice || pdfPreview.data?.basePrice || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {pdfPreview.type === "EOI" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Agreed Unit Purchase Price:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(pdfPreview.data?.unitPrice || opp.amount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-blue-200 text-blue-800">
                      <span className="font-bold">Advance Token Deposit Paid:</span>
                      <span className="font-bold text-base">{formatCurrency(pdfPreview.data?.tokenAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600">
                      <span>Payment Method: <strong>{pdfPreview.data?.paymentMethod || "Bank Transfer"}</strong></span>
                      <span>Transaction Ref: <strong className="font-mono">{pdfPreview.data?.paymentReference || "ADV-TXN"}</strong></span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-blue-700 pt-1">
                      <span>Status: <strong>PAYMENT VERIFIED • UNIT RESERVATION ACTIVE</strong></span>
                      <span>Verified: {formatDate(pdfPreview.data?.createdAt || new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>
              )}

              {pdfPreview.type === "PO" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Final Agreed Purchase Price:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(pdfPreview.data?.finalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-blue-700">
                      <span className="font-bold">Less: Advance Token Deposit Credited (Down Payment):</span>
                      <span className="font-bold">- {formatCurrency(pdfPreview.data?.downPayment || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-blue-200 font-bold">
                      <span className="text-slate-900">Remaining Balance Contract Payable:</span>
                      <span className="text-blue-700 text-base">
                        {formatCurrency(Math.max(0, (pdfPreview.data?.finalAmount || 0) - (pdfPreview.data?.downPayment || 0)))}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1">
                      Unit is marked as <strong>SOLD</strong>. Official Title Deed and Escrow Registration initialized with Dubai Land Department.
                    </div>
                  </div>
                </div>
              )}

              {/* Signatures & Corporate Seal */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <p className="font-bold text-slate-700 mb-10">Authorized Developer Signatory</p>
                  <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500">
                    Pentacloud Properties Executive Escrow Committee
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-10">Purchaser / Buyer Acceptance</p>
                  <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500">
                    {accountName} (Authorized Signatory)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 1: GENERATE QUOTATION (Strict 2-Column Left & Right Layout)      */}
      {/* ---------------------------------------------------------------------- */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Generate Commercial Quotation (Version 1)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Prepare formal price proposal for {opp.name}
                </p>
              </div>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-md hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleGenerateQuoteSubmit} className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Development <span className="text-blue-600">*</span>
                  </label>
                  <select
                    required
                    value={quoteForm.projectId}
                    onChange={(e) => setQuoteForm({ ...quoteForm, projectId: e.target.value, unitId: "" })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Allocated Unit <span className="text-blue-600">*</span>
                  </label>
                  <select
                    required
                    value={quoteForm.unitId}
                    onChange={(e) => {
                      const u = units.find((x) => x.id === e.target.value);
                      setQuoteForm({
                        ...quoteForm,
                        unitId: e.target.value,
                        basePrice: u?.finalPrice ? u.finalPrice.toString() : quoteForm.basePrice,
                      });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">-- Select Unit --</option>
                    {units
                      .filter(
                        (u) =>
                          (!quoteForm.projectId || u.projectId === quoteForm.projectId) &&
                          (u.status === "AVAILABLE" || u.id === quoteForm.unitId || u.id === opp.unitId)
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          Unit #{u.unitNumber} {u.building?.name ? `(${u.building.name})` : ""} - AED {u.finalPrice?.toLocaleString() || "N/A"}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Base Unit Price (AED) <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={quoteForm.basePrice}
                    onChange={(e) => setQuoteForm({ ...quoteForm, basePrice: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Plan Schedule <span className="text-blue-600">*</span>
                  </label>
                  <select
                    required
                    value={quoteForm.paymentPlan}
                    onChange={(e) => setQuoteForm({ ...quoteForm, paymentPlan: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                  >
                    <option value="20/80">20/80 Standard</option>
                    <option value="60/40">60/40 Construction Linked</option>
                    <option value="50/50">50/50 Balanced</option>
                    <option value="30/70">30/70 Handover Heavy</option>
                    <option value="40/60">40/60 Milestone</option>
                    <option value="10/90">10/90 Investor Special</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Proposal Valid Until
                  </label>
                  <input
                    type="date"
                    value={quoteForm.validUntil}
                    onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Buyer / Account
                  </label>
                  <input
                    type="text"
                    disabled
                    value={accountName}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Commercial Notes & Special Terms
                  </label>
                  <textarea
                    rows={2}
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  {submittingQuote ? "Creating..." : "Confirm & Create Quotation V1"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 2: PRICE NEGOTIATION (% vs Fixed AED) (Strict 2-Column Layout)   */}
      {/* ---------------------------------------------------------------------- */}
      {showNegotiateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-blue-600" />
                  Price Negotiation & Quotation V2 Revision
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Generates Quotation V2 while keeping baseline Quotation V1 intact
                </p>
              </div>
              <button
                onClick={() => setShowNegotiateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-md hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleNegotiateSubmit} className="p-6 space-y-5 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="block font-semibold text-slate-700 mb-2">
                  Select Discount Mode Requested by Customer:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNegotiateForm({
                        ...negotiateForm,
                        discountType: "PERCENTAGE",
                        discountValue: "10",
                      });
                    }}
                    className={`py-2 px-3 rounded-lg font-semibold text-xs border text-center transition-colors ${
                      negotiateForm.discountType === "PERCENTAGE"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Percentage Discount (e.g. 10%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNegotiateForm({
                        ...negotiateForm,
                        discountType: "FIXED",
                        discountValue: "100000",
                      });
                    }}
                    className={`py-2 px-3 rounded-lg font-semibold text-xs border text-center transition-colors ${
                      negotiateForm.discountType === "FIXED"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Fixed Amount Discount (e.g. 100,000 AED)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  {negotiateForm.discountType === "PERCENTAGE" ? (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Requested Discount Percentage (%) <span className="text-blue-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          required
                          value={negotiateForm.discountValue}
                          onChange={(e) => setNegotiateForm({ ...negotiateForm, discountValue: e.target.value })}
                          placeholder="e.g. 10"
                          className="w-full p-2.5 pr-8 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Equivalent to: <strong>AED {computedDiscountAmount.toLocaleString()}</strong> deduction
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Requested Fixed Discount Amount (AED) <span className="text-blue-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          required
                          value={negotiateForm.discountValue}
                          onChange={(e) => setNegotiateForm({ ...negotiateForm, discountValue: e.target.value })}
                          placeholder="e.g. 100000"
                          className="w-full p-2.5 pr-12 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 font-bold">AED</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Equivalent to: <strong>{computedEffectivePercent}%</strong> discount
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Plan Schedule
                    </label>
                    <select
                      value={negotiateForm.paymentPlan}
                      onChange={(e) => setNegotiateForm({ ...negotiateForm, paymentPlan: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                    >
                      <option value="20/80">20/80</option>
                      <option value="60/40">60/40</option>
                      <option value="50/50">50/50</option>
                      <option value="30/70">30/70</option>
                      <option value="40/60">40/60</option>
                      <option value="10/90">10/90</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                      Live Offer Price Calculation (Quotation V2)
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Original Base Price:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(calcBasePrice)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-blue-700">
                      <span>Total Discount Applied:</span>
                      <span className="font-bold">- {formatCurrency(computedDiscountAmount)}</span>
                    </div>
                    <div className="pt-2 border-t border-blue-200 flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-900">Revised Final Price:</span>
                      <span className="font-bold text-blue-700 text-base">{formatCurrency(computedFinalPrice)}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-2 border-t border-blue-100">
                    * Both Quotation V1 and revised Quotation V2 will be preserved with individual downloadable PDFs.
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Negotiation Notes / Client Justification
                  </label>
                  <textarea
                    rows={2}
                    value={negotiateForm.notes}
                    onChange={(e) => setNegotiateForm({ ...negotiateForm, notes: e.target.value })}
                    placeholder="e.g. Client requested 10% discount due to full upfront cash readiness..."
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNegotiateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNegotiate}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  {submittingNegotiate ? "Saving..." : "Apply & Issue Quotation V2"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 3: EOI & TOKEN ADVANCE (Strict 2-Column Left & Right Layout)     */}
      {/* ---------------------------------------------------------------------- */}
      {showEoiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Expression of Interest (EOI) & Advance Token Deposit
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Reserve Unit #{opp.unit?.unitNumber || "Selected"} and verify token deposit
                </p>
              </div>
              <button
                onClick={() => setShowEoiModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-md hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEoiSubmit} className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Agreed Deal Price (AED)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={eoiForm.unitPrice}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Token Advance Deposit Amount (AED) <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={eoiForm.tokenAmount}
                    onChange={(e) => setEoiForm({ ...eoiForm, tokenAmount: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Token Deposit Payment Method <span className="text-blue-600">*</span>
                  </label>
                  <select
                    required
                    value={eoiForm.paymentMethod}
                    onChange={(e) => setEoiForm({ ...eoiForm, paymentMethod: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (Wire)</option>
                    <option value="CHEQUE">Manager Cheque / Cheque</option>
                    <option value="CREDIT_CARD">Credit / Debit Card</option>
                    <option value="CASH">Cash Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction Ref / Cheque No. <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eoiForm.paymentReference}
                    onChange={(e) => setEoiForm({ ...eoiForm, paymentReference: e.target.value })}
                    placeholder="e.g. TXN-99482 or Cheque #10492"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Confirmed Payment Plan
                  </label>
                  <select
                    value={eoiForm.preferredPaymentPlan}
                    onChange={(e) => setEoiForm({ ...eoiForm, preferredPaymentPlan: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                  >
                    <option value="20/80">20/80</option>
                    <option value="60/40">60/40</option>
                    <option value="50/50">50/50</option>
                    <option value="30/70">30/70</option>
                    <option value="40/60">40/60</option>
                    <option value="10/90">10/90</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Advance Payment Status
                  </label>
                  <input
                    type="text"
                    disabled
                    value="VERIFIED (Locks Unit to RESERVED)"
                    className="w-full p-2.5 border border-blue-200 rounded-lg bg-blue-50 text-blue-700 font-semibold cursor-not-allowed"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    EOI Notes & Deposit Receipt Details
                  </label>
                  <textarea
                    rows={2}
                    value={eoiForm.notes}
                    onChange={(e) => setEoiForm({ ...eoiForm, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEoiModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEoi}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  {submittingEoi ? "Confirming..." : "Confirm EOI & Reserve Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 4: FINAL PURCHASE ORDER (PO) (Strict 2-Column Left & Right)      */}
      {/* ---------------------------------------------------------------------- */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  Execute Final Purchase Order (PO) Contract
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Deducts token advance as down payment, marks unit SOLD and Opportunity WON
                </p>
              </div>
              <button
                onClick={() => setShowPoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-md hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePoSubmit} className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Final Negotiated Deal Value (AED)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={poForm.finalAmount}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Advance Token Paid in EOI (Deducted Down Payment)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={poForm.downPayment}
                    className="w-full p-2.5 border border-blue-200 rounded-lg bg-blue-50 text-blue-700 font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Remaining Balance Payable (AED)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`AED ${(Math.max(0, poForm.finalAmount - poForm.downPayment)).toLocaleString()}`}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contract Payment Plan
                  </label>
                  <input
                    type="text"
                    disabled
                    value={poForm.paymentPlan}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-mono cursor-not-allowed"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Final Contract Execution Notes
                  </label>
                  <textarea
                    rows={2}
                    value={poForm.notes}
                    onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPo}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  {submittingPo ? "Executing..." : "Execute PO & Close Won Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 5: EDIT OPPORTUNITY (Strict 2-Column Left & Right Layout)        */}
      {/* ---------------------------------------------------------------------- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Edit Opportunity: {opp.opportunityNumber}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update commercial, account, inventory and broker specifications for this deal
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-md hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    1. Opportunity Information
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Core Deal & Customer Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Opportunity Name <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g. Marina Penthouse Acquisition"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Account (Buyer / Organization) <span className="text-blue-600">*</span>
                    </label>
                    <select
                      required
                      value={editForm.buyerId}
                      onChange={(e) => setEditForm({ ...editForm, buyerId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- Select Buyer Account --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name || acc.companyName || `${acc.firstName || ""} ${acc.lastName || ""}`.trim() || acc.accountNumber} ({acc.accountNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Designated Contact
                    </label>
                    <select
                      value={editForm.contactId}
                      onChange={(e) => setEditForm({ ...editForm, contactId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- None / Unassigned --</option>
                      {contacts
                        .filter((c) => !editForm.buyerId || c.buyerAccountId === editForm.buyerId || c.accountId === editForm.buyerId || c.id === editForm.contactId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ""}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Referring Broker / Channel Partner
                    </label>
                    <select
                      value={editForm.brokerId}
                      onChange={(e) => setEditForm({ ...editForm, brokerId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- Select Broker --</option>
                      {brokers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}{b.contactPerson && b.contactPerson !== b.name ? ` (${b.contactPerson})` : ""} {b.tradeLicense ? `[${b.tradeLicense}]` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Deal Amount (AED)
                    </label>
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      placeholder="e.g. 2800000"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Client Budget (AED)
                    </label>
                    <input
                      type="number"
                      value={editForm.budget}
                      onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                      placeholder="e.g. 3000000"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pipeline Stage
                    </label>
                    <select
                      value={editForm.stage}
                      onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                      <option value="CLOSED_LOST">Closed Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Win Probability (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.probability}
                      onChange={(e) => setEditForm({ ...editForm, probability: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Expected Close Date
                    </label>
                    <input
                      type="date"
                      value={editForm.closeDate}
                      onChange={(e) => setEditForm({ ...editForm, closeDate: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Property Type
                    </label>
                    <select
                      value={editForm.propertyType}
                      onChange={(e) => setEditForm({ ...editForm, propertyType: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="APARTMENT">Apartment</option>
                      <option value="PENTHOUSE">Penthouse</option>
                      <option value="VILLA">Villa</option>
                      <option value="TOWNHOUSE">Townhouse</option>
                      <option value="COMMERCIAL">Commercial Office</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    2. Project & Inventory Linkage
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Real Estate Asset Allocation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Project Development
                    </label>
                    <select
                      value={editForm.projectId}
                      onChange={(e) => setEditForm({ ...editForm, projectId: e.target.value, unitId: "" })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- None / General Project Inquiry --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Allocated Unit
                    </label>
                    <select
                      value={editForm.unitId}
                      onChange={(e) => setEditForm({ ...editForm, unitId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">Pending Shortlisting / None</option>
                      {units
                        .filter(
                          (u) =>
                            (!editForm.projectId || u.projectId === editForm.projectId) &&
                            (u.status === "AVAILABLE" || u.id === editForm.unitId || u.id === opp.unitId)
                        )
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            Unit #{u.unitNumber} {u.building?.name ? `(${u.building.name})` : ""} - AED {u.finalPrice?.toLocaleString() || "N/A"}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Scheduled Unit Visit (Viewing Slot)
                    </label>
                    <input
                      type="datetime-local"
                      value={editForm.scheduledVisitDate}
                      onChange={(e) => setEditForm({ ...editForm, scheduledVisitDate: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Method / Financing Mode
                    </label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- Select Payment Method --</option>
                      <option value="Cash">Cash</option>
                      <option value="Loan">Loan</option>
                      <option value="Mortgage">Mortgage</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash + Loan">Cash + Loan</option>
                      <option value="Developer Payment Plan">Developer Payment Plan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Plan Structure
                    </label>
                    <select
                      value={editForm.paymentPlan}
                      onChange={(e) => setEditForm({ ...editForm, paymentPlan: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                    >
                      <option value="20/80">20/80</option>
                      <option value="60/40">60/40</option>
                      <option value="50/50">50/50</option>
                      <option value="30/70">30/70</option>
                      <option value="40/60">40/60</option>
                      <option value="10/90">10/90</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Owner / Sales Advisor
                    </label>
                    <select
                      value={editForm.assignedAdvisorId}
                      onChange={(e) => setEditForm({ ...editForm, assignedAdvisorId: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- Unassigned --</option>
                      {advisors.map((adv) => (
                        <option key={adv.id} value={adv.id}>
                          {adv.firstName} {adv.lastName} ({adv.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Opportunity Reference
                    </label>
                    <input
                      type="text"
                      disabled
                      value={opp.opportunityNumber}
                      className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
                    />
                  </div>

                  <div className="flex items-center text-slate-400 text-[11px] pt-4">
                    <span>* Visit date and payment terms synchronize with buyer timeline</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    3. Description & Deal Notes
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Customer Requirements & Specifications</span>
                </div>
                <div>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Document client preferences, unit specifications, purchasing timeline or negotiation details..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Salesforce Lightning Sticky Action Bar */}
      {isInlineEditing && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 shadow-2xl flex items-center justify-center gap-4 transition-all">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2 mr-4">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Unsaved changes in Opportunity record
          </div>
          <button
            type="button"
            onClick={handleCancelInlineEdit}
            disabled={savingEdit}
            className="px-6 py-2 border border-slate-300 rounded-full font-semibold text-xs text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSaveInlineEdit()}
            disabled={savingEdit}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs shadow-md transition-colors flex items-center gap-2"
          >
            {savingEdit ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
