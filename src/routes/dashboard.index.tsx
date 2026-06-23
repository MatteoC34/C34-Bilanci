import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/")({
  component: () => {
    const nav = useNavigate();
    useEffect(() => { nav({ to: "/dashboard/overview" }); }, [nav]);
    return null;
  },
});