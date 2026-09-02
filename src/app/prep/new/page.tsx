import NewPrepForm from "@/components/NewPrepForm";

export default function NewPrepPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-ink mb-2">New prep pack</h1>
      <p className="text-ink-soft mb-8">
        Paste the job description and your resume text (minimum 200 characters each).
      </p>
      <NewPrepForm />
    </div>
  );
}
