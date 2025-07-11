"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Wallet, Shield, Package, Truck, Store, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const MANUFACTURERS = [
  "0x92187a2b0e46cEf360bF3a6DB1a36Bda4DF76e36", 
  "0xA3C8EE9981112A27998D9A77E95110672c9765cE"]

  const DISTRIBUTORS = [
  "0x235B703d61D8Ea4553627606b4ac510c2156dAc6", // your original one
  "0xfd5Bb320199E6bEA38ac1A2C7bf51Bfa0d3E5ab4"]

  const RETAILERS = [
  "0x84Ba1f39b0453aE2749A55f4C6f48eAE813584c7",
  "0xface1234abcd5678ef901234abcd5678ef901234"
  ]


  const connectWallet = async () => {
  if (!window.ethereum) {
    toast({
      title: "MetaMask Not Found",
      description: "Please install MetaMask to continue.",
      variant: "destructive",
    })
    return
  }

  setIsConnecting(true)
  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })

    if (accounts.length > 0) {
      const connectedAccount = accounts[0].toLowerCase()
      setAccount(connectedAccount)

      toast({
        title: "Wallet Connected",
        description: `Connected to ${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`,
      })

      // Check which role the connected account belongs to
      if (MANUFACTURERS.map(addr => addr.toLowerCase()).includes(connectedAccount)) {
        router.push("/manufacturer")
      } else if (DISTRIBUTORS.map(addr => addr.toLowerCase()).includes(connectedAccount)) {
        router.push("/distributor")
      } else if (RETAILERS.map(addr => addr.toLowerCase()).includes(connectedAccount)) {
        router.push("/retailer")
      } else {
        toast({
          title: "Unauthorized Address",
          description: "This wallet is not assigned to any role.",
          variant: "destructive",
        })
      }
    }
  } catch (error) {
    toast({
      title: "Connection Failed",
      description: "Failed to connect wallet. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsConnecting(false)
  }
}


  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0].toLowerCase())
        } else {
          setAccount(null)
        }
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">MediChain</h1>
            </div>
            {account && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Welcome to MediChain</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A decentralized medical supply tracking platform. Track medical crates securely using blockchain technology.
            Roles include Manufacturer, Distributor, and Retailer.
          </p>

          {!account ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Connect Your Wallet</span>
                </CardTitle>
                <CardDescription>Connect your MetaMask wallet to access your portal</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={connectWallet} disabled={isConnecting} className="w-full" size="lg">
                  {isConnecting ? "Connecting..." : "Connect MetaMask"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-green-600">Wallet Connected</CardTitle>
                <CardDescription>Redirecting to your portal...</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card className="text-center">
            <CardHeader>
              <Package className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Manufacturer Portal</CardTitle>
              <CardDescription>
                Generate crate codes, store manufacturing details, and set batch information
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Truck className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Distributor Portal</CardTitle>
              <CardDescription>Update storage locations, manage shipping details, and track dispatch</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Store className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Retailer Portal</CardTitle>
              <CardDescription>View complete crate journey, verify authenticity, and confirm delivery</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
