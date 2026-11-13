import React, { useState } from 'react';
import { Building2, School, GraduationCap, CheckCircle2, Send, Users, BookOpen } from 'lucide-react';

import { SupportedLanguage } from '../types';
import { BrandHeaderBand } from './BrandHeaderBand';

interface Props {
  language: SupportedLanguage;
}

export const NgoSchoolView: React.FC<Props> = ({ language }) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';

  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'school' | 'ngo' | 'researcher' | 'government'>('ngo');
  const [devicesNeeded, setDevicesNeeded] = useState('25');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !email) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: orgName,
          contactName,
          email,
          type,
          devicesNeeded: `${devicesNeeded} devices`,
          notes,
        }),
      });
      setSubmittedSuccess(true);
      setOrgName('');
      setContactName('');
      setEmail('');
      setNotes('');
    } catch (err) {
      console.error('Error submitting partner inquiry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Brand Header Band matching DrishtiAssist Logo (transparent variant without background block) */}
      <BrandHeaderBand
        serifPrefix="05 ·"
        variant="transparent"
        title={
          isTe
            ? 'పాఠశాలలు మరియు ఎన్‌జీవోల కోసం'
            : isHi
            ? 'संस्थाओं और दृष्टिबाधित विद्यालयों के लिए'
            : 'FOR SCHOOLS, NGOS & TRAINERS'
        }
        subtitle={
          isTe
            ? 'తరగతి గది శిక్షణ, పునరావాస కార్యక్రమాలు మరియు స్వతంత్ర జీవన పాఠ్యాంశాల్లో దృష్టి అసిస్ట్‌ను అమలు చేయండి.'
            : isHi
            ? 'दृष्टिबाधित छात्रों और वयस्कों के ओरिएंटेशन एवं मोबिलिटी (O&M) प्रशिक्षण में दृष्टि असिस्ट को शामिल करें।'
            : 'Deploy DrishtiAssist across classroom training, rehabilitation programs, and independent living curriculums.'
        }
        language={language}
      />

      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-10">

      {/* Feature Cards for Institutions - Warm Cream Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="card-warm p-6 rounded-2xl space-y-3">
          <div className="card-warm-icon-chip w-10 h-10 rounded-xl flex items-center justify-center font-bold">
            <School className="w-5 h-5" />
          </div>
          <h2 className="card-warm-heading text-base font-bold">
            {isHi ? 'विद्यालयों हेतु निःशुल्क' : '100% Free for Schools'}
          </h2>
          <p className="card-warm-body text-xs sm:text-sm leading-relaxed">
            {isHi
              ? 'बिना किसी सदस्यता शुल्क के हर छात्र के फोन पर सीधे स्थापित करें। कमजोर इंटरनेट में भी पूरी तरह कार्यक्षम।'
              : 'Zero licensing fees. Works on low-cost budget Android phones distributed through student assistive kits.'}
          </p>
        </div>

        <div className="card-warm p-6 rounded-2xl space-y-3">
          <div className="card-warm-icon-chip w-10 h-10 rounded-xl flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="card-warm-heading text-base font-bold">
            {isHi ? 'O&M प्रशिक्षण पाठ्यक्रम' : 'O&M Training Syllabus'}
          </h2>
          <p className="card-warm-body text-xs sm:text-sm leading-relaxed">
            {isHi
              ? 'व्हाइट केन तकनीकों के साथ डिजिटल ऑडियो अलर्ट को संयोजित करने के लिए विशेष प्रशिक्षक मार्गदर्शिका।'
              : 'Standardized modules for teaching students to coordinate white cane ground sweeps with spatial audio cues.'}
          </p>
        </div>

        <div className="card-warm p-6 rounded-2xl space-y-3">
          <div className="card-warm-icon-chip w-10 h-10 rounded-xl flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="card-warm-heading text-base font-bold">
            {isHi ? 'सामुदायिक योगदान' : 'Community Data Sandbox'}
          </h2>
          <p className="card-warm-body text-xs sm:text-sm leading-relaxed">
            {isHi
              ? 'स्थानीय भारतीय सड़कों की स्थिति पर आधारित मॉडल को और बेहतर बनाने के लिए एनजीओ डेटा सहयोग।'
              : 'Contribute labeled hazard photography from rural and semi-urban Indian roads to enhance CNN retraining.'}
          </p>
        </div>

      </div>

      {/* Partnership Contact Form - Warm Cream Card */}
      <div className="card-warm p-6 sm:p-8 rounded-2xl space-y-6">
        <div>
          <h2 className="card-warm-heading text-xl font-bold">
            {isHi ? 'साझेदारी या प्रशिक्षण अनुरोध फॉर्म' : 'Request Training or Institutional Deployment'}
          </h2>
          <p className="card-warm-body text-xs sm:text-sm mt-1">
            {isHi
              ? 'हरियाणा, दिल्ली एनसीआर और पूरे भारत के संस्थानों के लिए निःशुल्क सहायता उपलब्ध है।'
              : 'Free training sessions and deployment kits for organizations across India (Haryana, Delhi NCR, and nationwide).'}
          </p>
        </div>

        {submittedSuccess ? (
          <div className="card-privacy-box p-6 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#1F4D3A] shrink-0" />
            <div>
              <strong className="block text-[#1F4D3A] font-bold">
                {isHi ? 'अनुरोध सफलतापूर्वक प्राप्त हुआ' : 'Inquiry Received'}
              </strong>
              <p className="card-privacy-body text-xs sm:text-sm">
                {isHi
                  ? 'हमारी टीम 48 घंटों के भीतर आपसे संपर्क करेगी।'
                  : 'Our accessibility deployment team will contact you within 48 hours.'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                  {isHi ? 'संस्था या विद्यालय का नाम *' : 'Organization / School Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. National Association for the Blind"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-[var(--text-heading)] placeholder-[var(--text-body)]/60 text-sm focus:border-[var(--brand-ink)] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                  {isHi ? 'संपर्क व्यक्ति का नाम *' : 'Contact Person *'}
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-[var(--text-heading)] placeholder-[var(--text-body)]/60 text-sm focus:border-[var(--brand-ink)] focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                  {isHi ? 'ईमेल पता *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@school.org"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-[var(--text-heading)] placeholder-[var(--text-body)]/60 text-sm focus:border-[var(--brand-ink)] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                  {isHi ? 'संस्था का प्रकार' : 'Institution Type'}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-[var(--text-heading)] text-sm focus:border-[var(--brand-ink)] focus:outline-none transition"
                >
                  <option value="school">{isHi ? 'दृष्टिबाधित विद्यालय' : 'Blind / Special School'}</option>
                  <option value="ngo">{isHi ? 'गैर-सरकारी संगठन (NGO)' : 'NGO / Foundation'}</option>
                  <option value="researcher">{isHi ? 'शोध संस्थान' : 'Research Institute'}</option>
                  <option value="government">{isHi ? 'सरकारी विभाग' : 'Government Agency'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                  {isHi ? 'अनुमानित छात्र / उपकरण' : 'Estimated Devices / Users'}
                </label>
                <input
                  type="text"
                  value={devicesNeeded}
                  onChange={(e) => setDevicesNeeded(e.target.value)}
                  placeholder="e.g. 50 students"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-[var(--text-heading)] placeholder-[var(--text-body)]/60 text-sm focus:border-[var(--brand-ink)] focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                {isHi ? 'अतिरिक्त विवरण या आवश्यकताएं' : 'Notes or Specific Requirements'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details regarding student cohort, campus challenges, or language needs..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] text-[var(--text-heading)] placeholder-[var(--text-body)]/60 text-sm focus:border-[var(--brand-ink)] focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 rounded-xl bg-[var(--brand-charcoal)] hover:bg-[var(--brand-charcoal-2)] text-[var(--brand-offwhite)] font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : isHi ? 'अनुरोध भेजें' : 'Submit Inquiry'}</span>
            </button>
          </form>
        )}
      </div>

      </div>
    </div>
  );
};
