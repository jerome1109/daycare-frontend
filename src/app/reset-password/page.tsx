// Remove "use client" directive
import ResetPasswordForm from "@/app/reset-password/ResetPasswordForm";

// interface verifyPageProps {
//   params: Promise<{
//     verify: string;
//   }>;
// }

// This tells Next.js which paths to generate at build time
export default function ResetPasswordPage() {
  return (
    <>
      <ResetPasswordForm />
    </>
  );
}
