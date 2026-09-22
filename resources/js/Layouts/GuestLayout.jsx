export default function Guest({ children }) {
    return (
        <div className="login-page relative min-h-screen overflow-hidden bg-white" style={{ fontFamily: '"Segoe UI Variable", "Segoe UI", Inter, sans-serif' }}>
            <div className="pointer-events-none absolute inset-0 z-10 select-none" aria-hidden="true">
                <img
                    src="/images/border1.png"
                    alt=""
                    className="absolute right-0 top-0 h-auto w-[78vw] max-w-[360px] object-contain object-top-right opacity-90 sm:w-[430px]"
                />
                <img
                    src="/images/border2.png"
                    alt=""
                    className="absolute bottom-0 left-0 h-auto w-[180px] max-w-[42vw] object-contain opacity-95 sm:w-[36vw] lg:w-[32vw]"
                />
            </div>

            <div className="login-content relative z-0 flex min-h-screen items-start justify-center px-4 py-5 sm:px-8 sm:py-6 lg:items-center lg:justify-end lg:px-16 lg:py-6">
                <div className="grid w-full max-w-[1280px] gap-5 lg:grid-cols-[1fr_440px] lg:gap-16">
                    <div className="relative z-20 flex min-h-0 flex-col overflow-hidden bg-white px-2 py-1 sm:px-0 lg:min-h-[620px] lg:justify-center lg:p-12">
                        <div className="relative flex h-full flex-col justify-between">
                            <div className="flex items-center gap-2.5 lg:gap-3">
                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#d4af37]/60 bg-white/95 shadow-[0_8px_20px_rgba(212,175,55,0.18)] sm:h-12 sm:w-12">
                                    <img src="/images/opol-logo.png" alt="Municipality of Opol seal" className="h-10 w-10 object-contain" />
                                </div>
                                <div>
                                    <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#0d5ec8] sm:text-[10px] sm:tracking-[0.28em]">MENRO Certificate Services</div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0b1b45] sm:text-[11px] sm:tracking-[0.16em]">Poblacion Opol</div>
                                </div>
                            </div>

                            <div className="mt-4 max-w-md lg:mt-8">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#0d5ec8] sm:text-[10px] sm:tracking-[0.28em]">Municipal services</p>
                                <h1 className="mt-1.5 text-2xl font-black leading-[1.04] tracking-[-0.05em] text-[#0b1b45] sm:text-3xl lg:mt-3 lg:text-4xl">
                                    A Cleaner Today,
                                    <span className="mt-1 block text-[#8dc6ff]">A Healthier Tomorrow</span>
                                </h1>
                                <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-7">
                                    Together for a cleaner, greener and more sustainable Poblacion Opol.
                                </p>
                                <img
                                    src="/images/menro.png"
                                    alt="MENRO environmental services illustration"
                                    className="mt-3 h-auto max-h-[190px] w-full max-w-[560px] object-contain object-left drop-shadow-[0_18px_25px_rgba(11,27,69,0.16)] sm:max-h-[250px] lg:mt-8 lg:max-h-none"
                                />
                            </div>

                        </div>
                    </div>

                    <div className="relative z-20 flex items-start justify-center overflow-visible bg-transparent p-0 sm:p-4 lg:items-center lg:p-6">
                        <div className="relative z-10 w-full max-w-[440px] rounded-[22px] border border-[#d7e8ff] bg-white p-4 shadow-[0_18px_45px_rgba(13,94,200,0.14)] sm:rounded-[28px] sm:p-7 lg:shadow-[0_24px_65px_rgba(13,94,200,0.18)]">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
