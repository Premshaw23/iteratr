import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08090d] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
            Route_not_found
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95]">
          404
          <span className="block text-slate-300 text-2xl md:text-3xl font-extrabold tracking-tight mt-3">
            Page not found.
          </span>
        </h1>

        <p className="mt-6 text-slate-400 text-base md:text-lg leading-relaxed max-w-xl">
          The route you tried doesn&apos;t exist (or it moved). Use the links below to get back to the product.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-white text-slate-950 px-5 py-3 text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-white/10 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-transparent px-5 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-[11px] text-slate-500 uppercase tracking-[0.25em]">
          iteratr · adaptive_engine
        </div>
      </div>
    </div>
  )
}

