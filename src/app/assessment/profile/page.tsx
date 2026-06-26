import Link from "next/link";
import { AssessmentProfileForm } from "@/components/AssessmentProfileForm";
import { MobileTopBar } from "@/components/MobileTopBar";

export default function AssessmentProfilePage() {
  return (
    <main className="viewport">
      <section className="paper-frame assessment-profile-page grid grid-rows-[56px_1fr]">
        <MobileTopBar
          rightAction={<Link className="mobile-topbar__action" href="/">关闭</Link>}
          title="测评前"
        />
        <section className="assessment-profile-page__content">
          <div className="assessment-profile-page__hero">
            <div>
              <h1>先简单<br />认识你</h1>
              <p>这些信息会让报告更像是在对你说话，<br />而不是一份泛泛的测试结果。</p>
            </div>
            <span aria-hidden className="assessment-profile-page__branch" />
          </div>
          <div className="assessment-profile-page__notice">
            <span aria-hidden>◒</span>
            <p>注册身份已经建立。这里填写的内容会存入我的匣子。</p>
          </div>
          <AssessmentProfileForm />
        </section>
      </section>
    </main>
  );
}
