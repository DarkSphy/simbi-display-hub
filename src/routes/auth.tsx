import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — área do produtor simbi" },
      { name: "description", content: "Acesso do produtor ao painel de gestão do cardápio simbi." },
      { property: "og:title", content: "Entrar — área do produtor simbi" },
      { property: "og:description", content: "Acesso do produtor ao painel de gestão do cardápio simbi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setCarregando(true);

    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      setCarregando(false);
      if (error) {
        setErro("Não foi possível entrar. Confira o e-mail e a senha.");
        return;
      }
      navigate({ to: "/admin" });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setAviso("Conta criada. Se pedirmos confirmação, verifique seu e-mail e depois entre.");
    setModo("entrar");
  }

  return (
    <div className="min-h-screen bg-cream text-ink font-body flex flex-col">
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
            simbi
          </Link>
          <Link to="/" className="text-sm text-ink/50 hover:text-ink transition-colors">
            Voltar ao catálogo
          </Link>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="eyebrow text-clay mb-3">Área do produtor</p>
          <h1 className="font-display text-4xl font-medium leading-tight text-balance">
            {modo === "entrar" ? "Entre para cuidar do cardápio" : "Crie o acesso do produtor"}
          </h1>

          <form onSubmit={enviar} className="mt-8 bg-paper rounded-2xl ring-1 ring-black/5 p-6 space-y-4">
            <label className="block">
              <span className="eyebrow text-ink/45">E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full bg-cream rounded-full px-4 py-3 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none"
              />
            </label>
            <label className="block">
              <span className="eyebrow text-ink/45">Senha</span>
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-2 w-full bg-cream rounded-full px-4 py-3 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none"
              />
            </label>

            {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
            {aviso ? <p className="text-sm text-sage">{aviso}</p> : null}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-ink text-cream rounded-full py-3 text-sm font-medium disabled:opacity-60"
            >
              {carregando ? "Um instante…" : modo === "entrar" ? "Entrar" : "Criar acesso"}
            </button>

            <button
              type="button"
              onClick={() => {
                setModo(modo === "entrar" ? "criar" : "entrar");
                setErro(null);
                setAviso(null);
              }}
              className="w-full text-sm text-ink/55 hover:text-ink transition-colors"
            >
              {modo === "entrar" ? "Ainda não tenho acesso" : "Já tenho acesso"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
