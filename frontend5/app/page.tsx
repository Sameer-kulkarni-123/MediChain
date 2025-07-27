"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Shield, Package, Truck, Store, Factory, Network, Users, CheckCircle } from "lucide-react"
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
          setUserRole(null)
          setUserEntity(null)
        } else {
          const newAccount = accounts[0].toLowerCase()
          setAccount(newAccount)

          const allEntities = [
            ...supplyChainData.manufacturers,
            ...supplyChainData.distributors,
            ...supplyChainData.retailers,
          ]

          const foundEntity = allEntities.find((entity) => entity.walletAddress.toLowerCase() === newAccount)

          if (foundEntity) {
            setUserRole(foundEntity.category)
            setUserEntity(foundEntity)
          } else {
            setUserRole(null)
            setUserEntity(null)
          }
        }
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">MediChain</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A decentralized medical supply tracking platform with 3-level supply chain workflow. Connect manufacturers,
            distributors, and retailers in a secure blockchain network.
          </p>

          {!account ? (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              {isConnecting ? "Connecting..." : "Connect MetaMask Wallet"}
            </Button>
          ) : (
            <div className="space-y-4">
              <Badge variant="outline" className="text-green-600 border-green-600 px-4 py-2">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </Badge>
              {userEntity && (
                <div className="p-4 bg-white rounded-lg shadow-sm max-w-md mx-auto">
                  <h3 className="font-semibold text-gray-900">{userEntity.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{userEntity.category}</p>
                  <p className="text-xs text-gray-500">{userEntity.location}</p>
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.reload()} variant="outline">
                  Disconnect
                </Button>
                {userRole && <Button onClick={() => router.push(`/${userRole}`)}>Go to {userRole} Portal</Button>}
              </div>
            </div>
          )}
        </div>

        {/* Supply Chain Workflow */}
        <Card className="max-w-6xl mx-auto mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">3-Level Supply Chain Workflow</CardTitle>
            <CardDescription>Seamless product flow from manufacturing to retail</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              {[{
                title: "Manufacturer",
                icon: <Factory className="h-8 w-8 text-blue-600" />, color: "blue-600", bg: "bg-blue-100",
                steps: ["Generate product batches", "Select distributor partners", "Track assignments"]
              }, {
                title: "Distributor",
                icon: <Truck className="h-8 w-8 text-green-600" />, color: "green-600", bg: "bg-green-100",
                steps: ["Manage inventory", "Select retailer partners", "Coordinate logistics"]
              }, {
                title: "Retailer",
                icon: <Store className="h-8 w-8 text-purple-600" />, color: "purple-600", bg: "bg-purple-100",
                steps: ["Track received products", "View supply chain path", "Manage inventory"]
              }].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className={`w-16 h-16 ${item.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {item.icon}
                  </div>
                  <h3 className={`font-semibold mb-2 text-${item.color}`}>{idx + 1}. {item.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {idx === 0 && "Create products and assign to distributors using searchable dropdown"}
                    {idx === 1 && "Receive from manufacturers and forward to retailers"}
                    {idx === 2 && "Receive products and view complete supply chain journey"}
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    {item.steps.map((s, i) => <p key={i}>• {s}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Network Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {[{
            title: "Manufacturers",
            count: supplyChainData.manufacturers.length,
            icon: <Factory className="h-8 w-8 text-blue-600 mx-auto mb-2" />, color: "text-blue-600"
          }, {
            title: "Distributors",
            count: supplyChainData.distributors.length,
            icon: <Truck className="h-8 w-8 text-green-600 mx-auto mb-2" />, color: "text-green-600"
          }, {
            title: "Retailers",
            count: supplyChainData.retailers.length,
            icon: <Store className="h-8 w-8 text-purple-600 mx-auto mb-2" />, color: "text-purple-600"
          }, {
            title: "Total Network",
            count: supplyChainData.manufacturers.length + supplyChainData.distributors.length + supplyChainData.retailers.length,
            icon: <Network className="h-8 w-8 text-orange-600 mx-auto mb-2" />, color: "text-orange-600"
          }].map((item, idx) => (
            <Card key={idx} className="text-center">
              <CardContent className="pt-6">
                {item.icon}
                <div className={`text-2xl font-bold ${item.color}`}>{item.count}</div>
                <div className="text-sm text-gray-600">{item.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[{
            icon: <Users className="h-12 w-12 text-blue-600" />,
            title: "Searchable Partner Selection",
            color: "text-blue-600",
            description: "Find and connect with supply chain partners using advanced search and filtering"
          }, {
            icon: <Network className="h-12 w-12 text-green-600" />,
            title: "Connection Path Tracking",
            color: "text-green-600",
            description: "Visualize complete supply chain connections from manufacturer to retailer"
          }, {
            icon: <Shield className="h-12 w-12 text-purple-600" />,
            title: "Secure Blockchain Network",
            color: "text-purple-600",
            description: "Role-based access control with wallet authentication and verification"
          }].map((item, idx) => (
            <Card key={idx} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">{item.icon}</div>
                <CardTitle className={item.color}>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
