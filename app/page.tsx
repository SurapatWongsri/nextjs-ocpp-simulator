import { ChargerTabsClient } from '@/components/simulator/charger-tabs-client'
import { TopNav } from '@/components/simulator/top-nav'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export default function Home() {
  return (
    <>
      <TopNav />
      <main className="max-w-400 mx-auto w-full px-4 py-6 lg:px-6">
        <Card className="bg-background border-none shadow-lg">
          <CardHeader className="font-bold text-xl md:hidden sm:block">
            OCPP Simulator v.1.6
          </CardHeader>
          <CardContent className="p-8">
            <ChargerTabsClient />
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Developed by{' '}
              <a
                href="https://wakim.art"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Wakim
              </a>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  )
}
