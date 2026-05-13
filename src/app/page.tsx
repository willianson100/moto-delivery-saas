import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona direto para o dashboard. 
  // O middleware cuidará de mandar para /login se não houver sessão.
  redirect("/login");
}
