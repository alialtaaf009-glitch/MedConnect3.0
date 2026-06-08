import { useNavigate } from 'react-router-dom';

export default function Legal() {
  const nav = useNavigate();
  return (
    <div className="screen">
      <button className="link" onClick={() => nav(-1)}>‹ Back</button>
      <h1 className="h1" style={{ margin: '12px 0' }}>Privacy & Terms</h1>

      <div className="card">
        <p className="sub" style={{ fontSize: 12, marginBottom: 14 }}>
          This is a starting template, not legal advice. Have it reviewed by a professional before relying on it for a public launch.
        </p>

        <h2 style={{ fontSize: 17, fontWeight: 700, margin: '14px 0 6px' }}>Privacy</h2>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>
          MedConnect collects the information you provide — your name, email, exam, country, timezone,
          study preferences, optional registration details, and the messages you send. We use this only
          to match you with study partners and run the service. We do not sell your data or use it for advertising.
          Your password is stored securely (hashed). You can edit or remove your information from your profile,
          or request deletion of your account by contacting us.
        </p>

        <h2 style={{ fontSize: 17, fontWeight: 700, margin: '16px 0 6px' }}>Terms of Use</h2>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>
          MedConnect is a peer study-networking tool for medical professionals and exam candidates.
          It does not verify medical credentials — registration details are self-reported, and you should
          use your own judgement before sharing personal information with other users. MedConnect is not a
          source of medical advice, and any study material or discussion is for educational support only.
          Be respectful; harassment, impersonation, or misuse may result in removal. The service is provided
          "as is" without guarantees of availability.
        </p>

        <h2 style={{ fontSize: 17, fontWeight: 700, margin: '16px 0 6px' }}>Contact</h2>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>
          Questions about your data or these terms, or want your account deleted?
          Email us at <strong>medconnectsupport.io@gmail.com</strong> and we'll help.
        </p>
      </div>
    </div>
  );
}
