// /src/components/LoadingDog.jsx

export default function LoadingDog({
  title = "Loading data...",
  message = "Please wait while the dashboard prepares the operation view.",
}) {
  return (
    <div className="rounded-3xl border border-sky-100 bg-white p-6 text-center shadow-executive">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <img
          src="https://media1.tenor.com/m/IZLUFPIQoIIAAAAC/loading-dog.gif"
          alt="Loading"
          className="h-32 w-32 rounded-3xl object-cover shadow-lg"
        />

        <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-hpBlue">
          Loading
        </p>

        <h2 className="mt-1 text-2xl font-black text-hpNavy">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-600">
          {message}
        </p>
      </div>
    </div>
  );
}