import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen, Lightbulb, Volume2 } from "lucide-react";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero Section */}
      <section className="py-12 md:py-20 text-center">
        <h1 className="font-reading text-4xl md:text-5xl font-bold text-zinc-900 mb-4">
          Read Between the Lines
        </h1>
        <p className="font-ui text-xl text-zinc-700 mb-8 max-w-2xl mx-auto leading-relaxed">
          Babeling is a bilingual reading app that connects languages through word-by-word alignment,
          instant explanations, and pronunciation—transforming how you learn and understand foreign texts.
        </p>
        <Button asChild size="lg" className="font-semibold">
          <Link href="/translate">Get Started</Link>
        </Button>
      </section>

      {/* Features Grid */}
      <section className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Alignment */}
          <Card className="bg-blue-50/50 border-blue-100">
            <CardHeader>
              <div className="mb-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Word & Sentence Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-700 text-sm leading-relaxed">
                See exactly how words and sentences map between languages.
                Hover over any word to reveal its translation and connections.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2: Explanations */}
          <Card className="bg-white">
            <CardHeader>
              <div className="mb-3">
                <Lightbulb className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-lg">Inline Explanations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-700 text-sm leading-relaxed">
                Get instant dictionary definitions, grammar insights, and usage examples
                without leaving your reading flow.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3: Pronunciation */}
          <Card className="bg-orange-50/50 border-orange-100">
            <CardHeader>
              <div className="mb-3">
                <Volume2 className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Pronunciation Audio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-700 text-sm leading-relaxed">
                Listen to natural pronunciation for words, sentences, or entire paragraphs
                to improve your speaking and listening skills.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="py-12 text-center">
        <p className="font-ui text-lg text-zinc-700 mb-4">
          Ready to start reading in a new language?
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="/translate">Try Babeling Now</Link>
        </Button>
      </section>
    </div>
  );
}
