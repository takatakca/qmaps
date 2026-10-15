// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MerchantReviews from "@/components/merchant/MerchantReviews";
import type { ReviewWithAuthor } from "@/lib/reviewsWithAuthors";

const invokeMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: invokeMock } },
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const exampleReview = {
  id: "review-test",
  rating: 4,
  body: "Service rapide.",
  created_at: "2026-10-01T10:00:00Z",
  owner_reply: null,
  profiles: { display_name: "Cliente test" },
} as unknown as ReviewWithAuthor;

describe("merchant reviews with live-data-only UI", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    toastMock.mockReset();
  });

  it("links an empty review state to the actual merchant editor, without imagined recommendation policies", () => {
    render(<MemoryRouter><MerchantReviews reviews={[]} /></MemoryRouter>);
    expect(screen.getByText("Aucun avis disponible pour le moment")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Compléter les informations de mon commerce" });
    expect(link.getAttribute("href")).toBe("/merchant/business-info");
    expect(screen.queryByText(/logiciel de recommandation automatisé/i)).toBeNull();
  });

  it("uses the real review and submits a reply through the verified edge endpoint", async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });
    const onReplySaved = vi.fn();
    render(<MemoryRouter><MerchantReviews reviews={[exampleReview]} onReplySaved={onReplySaved} /></MemoryRouter>);
    expect(screen.getByText("Cliente test")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Répondre à cet avis" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Réponse au commentaire de Cliente test/ }), {
      target: { value: "  Merci pour votre passage! " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publier la réponse" }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith("merchant-reply-review", {
      body: { reviewId: "review-test", body: "Merci pour votre passage!" },
    }));
    await waitFor(() => expect(onReplySaved).toHaveBeenCalledTimes(1));
  });
});
