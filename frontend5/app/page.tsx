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

  const MANUFACTURER_ADDRESS = "0xc4546db5f94e4bf5ef3d85f249768f469c5446c6"
  const DISTRIBUTOR_ADDRESS = "2"
  const RETAILER_ADDRESS = "3"

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

        // Route based on wallet address
        if (connectedAccount === MANUFACTURER_ADDRESS.toLowerCase()) {
          router.push("/manufacturer")
        } else if (connectedAccount === DISTRIBUTOR_ADDRESS.toLowerCase()) {
          // For demo purposes, route to distributor for other addresses
          // In production, you'd have specific address checks for each role
          router.push("/distributor")
        }
        else if (connectedAccount === RETAILER_ADDRESS.toLowerCase()) {
          router.push("/retailer")

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
