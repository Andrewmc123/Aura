// Privacy Policy, Terms of Use (with Community Guidelines) and Support.
// These are public pages — Apple needs the Privacy and Support URLs, and they
// must open without signing in.
//
// NOTE FOR THE OWNER: this wording is a starting template, not legal advice.
// Read it through and adjust it to match how you actually run Aura.
import { Link, useNavigate } from "react-router-dom";
import { useAppConfig } from "../../utils/safety";
import "../Safety/Safety.css";

const UPDATED = "November 16, 2026";

function Shell({ title, children }) {
  const navigate = useNavigate();
  return (
    <div className="legal-page">
      <button type="button" className="legal-back" onClick={() => navigate(-1)}>&#8592; Back</button>
      <h1>{title}</h1>
      <p className="legal-updated">Last updated {UPDATED}</p>
      {children}
      <nav className="legal-nav">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms &amp; Community Guidelines</Link>
        <Link to="/support">Support</Link>
      </nav>
    </div>
  );
}

function Contact() {
  const { support_email: email } = useAppConfig();
  return email ? <a href={`mailto:${email}`}>{email}</a> : <span>the Support page in the app</span>;
}

export function PrivacyPage() {
  const { minimum_age: minAge } = useAppConfig();
  return (
    <Shell title="Privacy Policy">
      <p>
        This policy explains what Aura collects, why, and the choices you have.
        By using Aura you agree to it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details</strong> — your name, username, email address, date of birth and a securely hashed password.</li>
        <li><strong>Profile details you choose to add</strong> — photo, bio, city and address.</li>
        <li><strong>Content you create</strong> — videos, photos, audio, stories, comments, messages, live streams, group chats and shop listings.</li>
        <li><strong>Activity</strong> — likes, follows, bookmarks, profile visits, when you were last active, and reports or blocks you make.</li>
        <li><strong>Camera, microphone and photo library</strong> — only when you choose to record or upload, and only what you choose to post.</li>
        <li><strong>Face Vault</strong> — if you use the Vault, photos and the face data used to group them stay tied to your account and are never used to identify people outside your own Vault.</li>
        <li><strong>Technical data</strong> — cookies that keep you signed in and basic server logs (such as IP address and device type) used for security.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run Aura: show your posts, deliver messages, and build your feed.</li>
        <li>To keep people safe: review reports, enforce the Community Guidelines and prevent abuse.</li>
        <li>To fix problems and improve the app.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use it for third-party advertising or tracking across other apps.</p>

      <h2>Who can see your information</h2>
      <ul>
        <li>Your profile, posts, comments and public activity are visible to other people on Aura. Your email, address and date of birth are never shown to other users.</li>
        <li>Messages are visible to you and the people you send them to. Our moderators may review a message if it is reported.</li>
        <li>Service providers that host Aura (servers, database and media storage) process data on our behalf.</li>
        <li>We may disclose information when the law requires it or to protect someone&apos;s safety.</li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li><strong>Delete your account</strong> at any time in Settings &rsaquo; Account &rsaquo; Delete account. This permanently removes your profile, posts, comments, messages and other data.</li>
        <li><strong>Edit your details</strong> in Settings.</li>
        <li><strong>Control who can reach you</strong> with the privacy settings, and block or report anyone.</li>
      </ul>

      <h2>Keeping data</h2>
      <p>We keep your information while your account is open. When you delete your account, your data is removed from our live systems right away. Reports made about an account may be kept to protect other users.</p>

      <h2>Children</h2>
      <p>Aura is not for anyone under {minAge}. We do not knowingly collect information from children under {minAge}; if we learn that we have, we delete the account.</p>

      <h2>Changes</h2>
      <p>If this policy changes in a meaningful way we will update this page and the date above.</p>

      <h2>Contact</h2>
      <p>Questions or requests about your data: <Contact />.</p>
    </Shell>
  );
}

export function TermsPage() {
  const { minimum_age: minAge } = useAppConfig();
  return (
    <Shell title="Terms of Use & Community Guidelines">
      <p>These terms are an agreement between you and Aura. By creating an account or using Aura you accept them.</p>

      <h2>Using Aura</h2>
      <ul>
        <li>You must be at least {minAge} years old.</li>
        <li>Keep your login details safe. You are responsible for what happens on your account.</li>
        <li>You own what you post. You give Aura permission to host, display and share it inside the app so the service can work.</li>
        <li>Only post content you have the right to share.</li>
      </ul>

      <h2 id="guidelines">Community Guidelines</h2>
      <p><strong>Aura has zero tolerance for objectionable content and abusive behaviour.</strong> You may not post, send or stream:</p>
      <ul>
        <li>Harassment, bullying, threats or content that targets someone for abuse.</li>
        <li>Hate speech or slurs about race, ethnicity, religion, gender, sexual orientation, disability or similar traits.</li>
        <li>Nudity, pornography or sexually explicit content.</li>
        <li>Any sexual content involving minors, or content that endangers children. This is reported to the authorities.</li>
        <li>Graphic violence, or content that promotes self-harm or suicide.</li>
        <li>Illegal activity, including selling illegal goods, drugs or weapons.</li>
        <li>Spam, scams, impersonation or misleading content.</li>
        <li>Other people&apos;s private information without their permission.</li>
        <li>Content that infringes someone else&apos;s copyright or trademark.</li>
      </ul>

      <h2>Reporting and enforcement</h2>
      <ul>
        <li>You can report any post, comment, message, live stream or account, and block anyone, from inside the app.</li>
        <li>We review reports within 24 hours. We remove content that breaks these guidelines and remove the accounts responsible.</li>
        <li>Some words are filtered automatically before they can be posted.</li>
        <li>We may remove content or suspend accounts at our discretion to keep the community safe.</li>
      </ul>

      <h2>Bolts, gifts and the Shop</h2>
      <p>Bolts and gifts are in-app items with no cash value and cannot be exchanged for money unless a feature explicitly says otherwise. Shop listings are created by sellers, who are responsible for what they list.</p>

      <h2>Ending your account</h2>
      <p>You can delete your account at any time in Settings. We may suspend or end accounts that break these terms.</p>

      <h2>Disclaimers</h2>
      <p>Aura is provided &ldquo;as is&rdquo;. To the extent the law allows, we are not liable for content posted by users or for indirect losses arising from use of the app.</p>

      <h2>Contact</h2>
      <p>Questions about these terms: <Contact />.</p>
    </Shell>
  );
}

export function SupportPage() {
  return (
    <Shell title="Support">
      <h2>Get help</h2>
      <p>Email us at <Contact /> and we&apos;ll get back to you as soon as we can.</p>

      <h2>Report something</h2>
      <p>Tap the <strong>&hellip;</strong> menu on any post or profile, or the flag next to a comment or message, and choose <strong>Report</strong>. Reports are reviewed within 24 hours.</p>

      <h2>Block someone</h2>
      <p>Open their profile, tap <strong>&hellip;</strong> and choose <strong>Block</strong>. You won&apos;t see each other&apos;s posts, comments or messages. Manage your blocked list in Settings &rsaquo; Privacy.</p>

      <h2>Delete your account</h2>
      <p>Go to Settings &rsaquo; Account &rsaquo; Delete account. This permanently removes your account and everything you posted, and can&apos;t be undone.</p>
    </Shell>
  );
}
