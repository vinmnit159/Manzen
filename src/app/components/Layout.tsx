import { createContext, useContext, useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "@/app/components/Sidebar";
import { Header } from "@/app/components/Header";

// Shared context so Header can toggle the sidebar
interface SidebarContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

export const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  toggle: () => {},
  close: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const ctx: SidebarContextValue = {
    open: sidebarOpen,
    toggle: () => setSidebarOpen((v) => !v),
    close: () => setSidebarOpen(false),
  };

  return (
    <SidebarContext.Provider value={ctx}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Overlay (mobile only) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={ctx.close}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — off-canvas on mobile, static on desktop */}
        <div
          className={[
            "fixed inset-y-0 left-0 z-30 flex-shrink-0 transition-transform duration-300 ease-in-out",
            "lg:relative lg:translate-x-0 lg:z-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
