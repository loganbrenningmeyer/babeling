import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function About() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Left Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Type something..."
            className="min-h-screen"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Right Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Type something..."
            className="min-h-screen"
          />
        </CardContent>
      </Card>
    </div>
  )
}
