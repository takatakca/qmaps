import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Thread = { business_id: string; merchant_id: string; customer_id: string };

export function MessageThread({
  thread,
  userId,
}: {
  thread: Thread;
  userId: string;
}) {
  const cache = useQueryClient();
  const key = [
    "business-mail",
    thread.business_id,
    thread.merchant_id,
    thread.customer_id,
    userId,
  ];
  const [draft, setDraft] = useState("");
  const [messageId, setMessageId] = useState(() => crypto.randomUUID());
  const [limit, setLimit] = useState(20);
  const messages = useQuery({
    queryKey: [...key, limit],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_mail")
        .select("id,body,author_id,created_at")
        .match(thread)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit + 1);
      if (error) throw error;
      return data;
    },
  });
  const send = useMutation({
    mutationFn: async () => {
      const body = draft.trim();
      const result = await supabase
        .from("business_mail")
        .insert({ ...thread, id: messageId, body })
        .select("id")
        .single();
      if (result.error) {
        if (result.error.code !== "23505") throw result.error;
        const previous = await supabase
          .from("business_mail")
          .select("author_id,body")
          .match(thread)
          .eq("id", messageId)
          .single();
        if (previous.data?.author_id !== userId || previous.data.body !== body)
          throw result.error;
      }
    },
    onSuccess: async () => {
      setDraft("");
      setMessageId(crypto.randomUUID());
      await Promise.all([
        cache.invalidateQueries({ queryKey: key }),
        cache.invalidateQueries({ queryKey: ["business-inbox"] }),
      ]);
    },
  });
  return (
    <div className="space-y-3">
      {messages.isPending && <p>Chargement…</p>}
      {messages.isError && (
        <Button onClick={() => messages.refetch()}>
          Recharger la conversation
        </Button>
      )}
      {messages.data?.length > limit && (
        <Button variant="link" onClick={() => setLimit(limit + 20)}>
          Messages plus anciens
        </Button>
      )}
      {messages.data
        ?.slice(0, limit)
        .reverse()
        .map((m) => (
          <article key={m.id} className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
              {m.author_id === userId
                ? "Vous"
                : userId === thread.merchant_id
                  ? "Client"
                  : "Commerce"}{" "}
              · {new Date(m.created_at).toLocaleString("fr-CA")}
            </p>
            <p className="whitespace-pre-line break-words">{m.body}</p>
          </article>
        ))}
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim() && !send.isPending) send.mutate();
        }}
      >
        <label>
          Votre message
          <Textarea
            required
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <Button disabled={send.isPending || !draft.trim() || messages.isError}>
          Envoyer
        </Button>
        {send.isError && (
          <p role="alert">Le message n’a pas pu être enregistré. Réessayez.</p>
        )}
      </form>
    </div>
  );
}

export function BusinessInbox({ businessId }: { businessId?: string }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Threads
      key={user.id + (businessId ?? "")}
      userId={user.id}
      businessId={businessId}
    />
  );
}

function Threads({
  businessId,
  userId,
}: {
  businessId?: string;
  userId: string;
}) {
  const [selected, setSelected] = useState<Thread | null>(null);
  const [limit, setLimit] = useState(20);
  const threads = useQuery({
    queryKey: ["business-inbox", userId, businessId ?? "customer", limit],
    refetchInterval: 20000,
    queryFn: async () => {
      let query = supabase.from("business_mail_threads").select("*");
      query = businessId
        ? query.eq("merchant_id", userId).eq("business_id", businessId)
        : query.eq("customer_id", userId);
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit + 1);
      if (error) throw error;
      return data;
    },
  });
  return (
    <section className="space-y-3">
      {selected ? (
        <>
          <Button variant="link" onClick={() => setSelected(null)}>
            Toutes les conversations
          </Button>
          <MessageThread thread={selected} userId={userId} />
        </>
      ) : (
        <>
          {threads.isPending ? (
            <p>Chargement…</p>
          ) : threads.isError ? (
            <Button onClick={() => threads.refetch()}>
              Recharger les conversations
            </Button>
          ) : !threads.data.length ? (
            <p className="text-sm text-muted-foreground">
              Aucune conversation avec{" "}
              {businessId ? "un client" : "un commerce"}.
            </p>
          ) : (
            threads.data.slice(0, limit).map((t) => (
              <button
                className="block w-full rounded-xl border p-3 text-left"
                key={t.id}
                onClick={() =>
                  setSelected({
                    business_id: t.business_id,
                    merchant_id: t.merchant_id,
                    customer_id: t.customer_id,
                  })
                }
              >
                <strong>
                  {businessId ? "Conversation client" : t.business_name}
                </strong>
                <span className="block truncate">{t.body}</span>
                <time className="text-xs">
                  {new Date(t.created_at).toLocaleString("fr-CA")}
                </time>
              </button>
            ))
          )}
          {threads.data?.length > limit && (
            <Button variant="link" onClick={() => setLimit(limit + 20)}>
              Voir plus
            </Button>
          )}
        </>
      )}
    </section>
  );
}

export function AskBusiness({
  businessId,
  merchantId,
}: {
  businessId: string;
  merchantId: string | null;
}) {
  const { user } = useAuth();
  if (!merchantId)
    return <p>Cette fiche n’a pas encore de destinataire pour les messages.</p>;
  if (!user)
    return (
      <Link to="/auth" className="text-primary underline">
        Me connecter pour écrire au commerce
      </Link>
    );
  if (user.id === merchantId)
    return (
      <Link to="/merchant/inbox" className="text-primary underline">
        Ouvrir la boîte de réception du commerce
      </Link>
    );
  return (
    <MessageThread
      key={businessId + merchantId + user.id}
      userId={user.id}
      thread={{
        business_id: businessId,
        merchant_id: merchantId,
        customer_id: user.id,
      }}
    />
  );
}
