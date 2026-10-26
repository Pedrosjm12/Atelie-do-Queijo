import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { FocoNoConteudo } from '@/components/FocoNoConteudo';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { SupportFab } from '@/components/SupportFab';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--fonte-titulo',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fonte-texto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Ateliê do Queijo', template: '%s — Ateliê do Queijo' },
  description: 'Queijos de autor, escolhidos à mão.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${manrope.variable}`}>
      <body>
        <a href="#conteudo" className="pular-conteudo">
          Pular para o conteúdo
        </a>
        <FocoNoConteudo />
        <AnnouncementBar />
        <Header />
        <main id="conteudo" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <SupportFab />
      </body>
    </html>
  );
}
