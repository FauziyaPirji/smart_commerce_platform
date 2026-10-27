import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Home, ShoppingBag, } from "lucide-react";

const NotFound = () => {
    return (
        <main className="min-h-[70vh] bg-background px-4 py-16">
            <div className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center">

                {/* 404 Icon */}
                <div className="grid size-20 place-items-center rounded-3xl bg-secondary text-primary">
                    <AlertCircle size={38} />
                </div>

                {/* 404 */}
                <p className="mono mt-7 text-xs font-bold uppercase tracking-[0.25em] text-primary">
                    Error 404
                </p>

                <h1 className="display mt-3 text-5xl font-extrabold tracking-tight sm:text-6xl">
                    Page not found
                </h1>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                    Sorry, we couldn't find the page you're looking for.
                    It may have been moved, deleted, or the URL might be incorrect.
                </p>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                    >
                        <Home size={16} />
                        Back to home
                    </Link>

                    <Link
                        to="/shop"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold transition hover:border-primary hover:text-primary"
                    >
                        <ShoppingBag size={16} />
                        Browse products
                    </Link>

                </div>

                {/* Back */}
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"
                >
                    <ArrowLeft size={14} />
                    Go back
                </button>

                {/* Small branding message */}
                <div className="mt-12 rounded-2xl border border-border bg-card px-6 py-5">
                    <p className="text-sm font-bold">
                        SmartCommerce
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Discover products from trusted independent vendors.
                    </p>
                </div>

            </div>
        </main>
    );
};

export default NotFound;