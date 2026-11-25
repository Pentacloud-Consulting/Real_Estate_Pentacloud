"use client";

import { useEffect, useState, use } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  User,
  Phone,
  Mail,
  ExternalLink,
  Eye,
  Check,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function ClientKycPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fetchPortalData = async () => {
    try {
      const res = await fetch(`/api/kyc/${id}`);
      const d = await res.json();
      if (res.ok) {
        setData(d);
      } else {
        setError(d.error || "Document collection link is invalid or expired.");
      }
    } catch {
      setError("Unable to connect to document portal. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [id]);

  const handleFileUpload = async (docType: string, file: File) => {
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("File size exceeds 25 MB limit. Please upload a smaller file.");
      return;
    }

    setUploadingDoc(docType);
    setUploadSuccess(null);

    try {
      // Read file as base64 data URL
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const res = await fetch(`/api/kyc/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docType,
            fileName: file.name,
            fileData: base64Data,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
          }),
        });

        const resData = await res.json();
        if (res.ok) {
          setUploadSuccess(docType);
          fetchPortalData();
        } else {
          alert(resData.error || "Failed to upload document. Please try again.");
        }
        setUploadingDoc(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Error reading file. Please try again.");
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-slate-600 font-semibold text-sm">Loading Secure KYC Portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Document Portal Unavailable</h2>
          <p className="text-sm text-slate-600">{error || "The link you accessed is no longer active."}</p>
          <div className="pt-2">
            <p className="text-xs text-slate-400">Please contact your Pentacloud Real Estate advisor for an updated link.</p>
          </div>
        </div>
      </div>
    );
  }

  const { opportunity, documents = [], documentTypes = [] } = data;
  const buyerName = opportunity.buyer
    ? `${opportunity.buyer.firstName || ""} ${opportunity.buyer.lastName || ""}`.trim() || opportunity.buyer.companyName || opportunity.buyer.name
    : opportunity.name;

  const uploadedDocTypeIds = new Set(documents.map((d: any) => d.docType));
  const uploadedCount = documentTypes.filter((dt: any) => uploadedDocTypeIds.has(dt.id)).length;
  const progressPercent = Math.round((uploadedCount / documentTypes.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              P
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-tight tracking-tight">
                PENTACLOUD PROPERTIES
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Client KYC & Due Diligence Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">256-Bit SSL Encrypted</span>
            <span className="sm:hidden">Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Deal Summary Hero Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                Official Document Request
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Welcome, {buyerName}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ref: <span className="font-mono font-semibold text-slate-700">{opportunity.opportunityNumber}</span> • {opportunity.name}
              </p>
            </div>

            {opportunity.advisor && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-left min-w-[210px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Your Dedicated Advisor
                </span>
                <p className="font-bold text-slate-900">
                  {opportunity.advisor.firstName} {opportunity.advisor.lastName}
                </p>
                <div className="mt-1 space-y-0.5 text-slate-600 text-[11px]">
                  {opportunity.advisor.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{opportunity.advisor.phone}</span>
                    </div>
                  )}
                  {opportunity.advisor.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[170px]">{opportunity.advisor.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Property Allocation Details */}
          {(opportunity.project || opportunity.unit) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
              {opportunity.project && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Project</span>
                  <span className="font-semibold text-slate-800">{opportunity.project.name}</span>
                </div>
              )}
              {opportunity.unit && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Reserved Unit</span>
                  <span className="font-semibold text-slate-800">
                    Unit #{opportunity.unit.unitNumber} ({opportunity.unit.unitType})
                  </span>
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Compliance Requirement</span>
                <span className="font-semibold text-emerald-700">RERA AML / KYC Verification</span>
              </div>
            </div>
          )}

          {/* Overall Upload Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-700">
                KYC Verification Checklist: {uploadedCount} of {documentTypes.length} Completed
              </span>
              <span className="text-blue-700 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Document Checklist Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Required Documents Checklist
            </h3>
            <span className="text-xs text-slate-500">
              Accepted formats: PDF, JPG, PNG (Max 25 MB)
            </span>
          </div>

          <div className="space-y-3.5">
            {documentTypes.map((dt: any, index: number) => {
              const uploadedDoc = documents.find((d: any) => d.docType === dt.id);
              const isUploaded = Boolean(uploadedDoc);
              const isUploadingThis = uploadingDoc === dt.id;

              return (
                <div
                  key={dt.id}
                  className={`bg-white rounded-xl border transition-all overflow-hidden ${
                    isUploaded
                      ? "border-emerald-200 shadow-2xs bg-emerald-50/10"
                      : "border-slate-200 shadow-xs hover:border-blue-300"
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Document Info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isUploaded
                            ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {isUploaded ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <span className="font-bold text-xs">{index + 1}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{dt.title}</h4>
                          {dt.required ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              Optional
                            </span>
                          )}

                          {isUploaded && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                uploadedDoc.status === "VERIFIED"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-blue-100 text-blue-800 border-blue-300"
                              }`}
                            >
                              {uploadedDoc.status === "VERIFIED" ? "Verified ✓" : "Uploaded (Pending Review)"}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {dt.description}
                        </p>

                        {isUploaded && (
                          <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                              📎 {uploadedDoc.originalName}
                            </span>
                            <span className="text-slate-400">
                              ({Math.round((uploadedDoc.fileSize || 0) / 1024)} KB)
                            </span>
                            <span className="text-slate-400 hidden sm:inline">
                              Uploaded {new Date(uploadedDoc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="shrink-0 flex items-center gap-2 sm:self-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={isUploadingThis}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(dt.id, file);
                          }}
                          className="hidden"
                        />
                        <span
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                            isUploadingThis
                              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                              : isUploaded
                              ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-blue-400"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {isUploadingThis
                            ? "Uploading..."
                            : isUploaded
                            ? "Replace Document"
                            : "Upload Document"}
                        </span>
                      </label>

                      {isUploaded && uploadedDoc.filePath && (
                        <a
                          href={uploadedDoc.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
                          title="View Uploaded Document"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Regulatory Footer */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700">
            <Lock className="w-4 h-4 text-emerald-600" />
            Bank-Grade Confidentiality & Data Protection
          </div>
          <p className="max-w-2xl mx-auto leading-relaxed">
            All submitted identification records are stored in encrypted vaults and used strictly for anti-money laundering (AML), Know Your Customer (KYC), and Dubai Land Department / RERA real estate registration protocols. Documents are never shared with unauthorized third parties.
          </p>
        </div>
      </main>
    </div>
  );
}
