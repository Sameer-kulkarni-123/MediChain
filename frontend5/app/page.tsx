"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Truck, Store, Factory, Users, Network } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

import {
  getManufacturer,
  getDistributor,
  getRetailerByWallet,
  getAllManufacturers,
  getAllDistributors,
  getAllRetailers,
  getAllConnections,
} from "@/api_local" // ✅ Updated import

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEntity, setUserEntity] = useState<any>(null)
  const [counts, setCounts] = useState({
    manufacturers: 0,
    distributors: 0,
    retailers: 0,
    totalEntities: 0,
    totalConnections: 0,
  })

  const { toast } = useToast()
  const router = useRouter()

  const connectWallet = async () => {
  if (!window.ethereum) {
    toast({
      title: "MetaMask Not Found",
      description: "Please install MetaMask to continue",
      variant: "destructive",
    });
    return;
  }

  setIsConnecting(true);
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts.length) return;

    const connectedAccount = accounts[0].toLowerCase();
    setAccount(connectedAccount);

    let foundEntity = null;
    let role = "";

    // ✅ 1. Check Manufacturers
    try {
      const res = await getAllManufacturers();
      const match = res.data.find(
        (entity: any) => entity.walletAddress.toLowerCase() === connectedAccount
      );
      if (match) {
        foundEntity = match;
        role = "manufacturer";
      }
    } catch (err) {
      console.log("Manufacturers fetch failed:", err);
    }

    // ✅ 2. Check Distributors
    if (!foundEntity) {
      try {
        const res = await getAllDistributors();
        const match = res.data.find(
          (entity: any) => entity.walletAddress.toLowerCase() === connectedAccount
        );
        if (match) {
          foundEntity = match;
          role = "distributor";
        }
      } catch (err) {
        console.log("Distributors fetch failed:", err);
      }
    }

    // ✅ 3. Check Retailers
    if (!foundEntity) {
      try {
        const res = await getAllRetailers();
        const match = res.data.find(
          (entity: any) => entity.walletAddress.toLowerCase() === connectedAccount
        );
        if (match) {
          foundEntity = match;
          role = "retailer";
        }
      } catch (err) {
        console.log("Retailers fetch failed:", err);
      }
    }

    // ✅ Final result
    if (foundEntity) {
      setUserRole(role);
      setUserEntity(foundEntity);
      toast({
        title: "Wallet Connected",
        description: `Connected as ${role}: ${foundEntity.name}`,
      });
      router.push(`/${role}`);
    } else {
      toast({
        title: "Access Denied",
        description: "Your wallet address is not registered in the supply chain network",
        variant: "destructive",
      });
    }
  } catch (error) {
    toast({
      title: "Connection Failed",
      description: "Failed to connect wallet. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsConnecting(false);
  }
};

  // ✅ Fetch dynamic counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [mans, dists, rets, conns] = await Promise.all([
          getAllManufacturers(),
          getAllDistributors(),
          getAllRetailers(),
          getAllConnections(),
        ])

        const manufacturersCount = mans?.data?.length || 0
        const distributorsCount = dists?.data?.length || 0
        const retailersCount = rets?.data?.length || 0
        const connectionsCount = conns?.data?.length || 0

        setCounts({
          manufacturers: manufacturersCount,
          distributors: distributorsCount,
          retailers: retailersCount,
          totalEntities: manufacturersCount + distributorsCount + retailersCount,
          totalConnections: connectionsCount,
        })
      } catch (error) {
        console.error("Error fetching counts:", error)
      }
    }

    fetchCounts()
  }, [])

  // ✅ Wallet account change listener
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null)
          setUserRole(null)
          setUserEntity(null)
        } else {
          setAccount(accounts[0].toLowerCase())
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-blue-600 rounded-full">
              <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Welcome to <span className="text-blue-600">MediChain</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            A decentralized medical supply tracking platform with 3-level supply chain workflow. Connect manufacturers,
            distributors, and retailers in a secure blockchain network.
          </p>

          {!account ? (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg w-full sm:w-auto"
            >
              {isConnecting ? "Connecting..." : "Connect MetaMask Wallet"}
            </Button>
          ) : (
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="text-green-600 border-green-600 px-3 sm:px-4 py-2 text-sm sm:text-base"
              >
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </Badge>
              {userEntity && (
                <div className="p-4 bg-white rounded-lg shadow-sm max-w-md mx-auto">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{userEntity.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 capitalize">{userEntity.category}</p>
                  <p className="text-xs text-gray-500">{userEntity.location}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full sm:w-auto">
                  Disconnect
                </Button>
                {userRole && (
                  <Button onClick={() => router.push(`/${userRole}`)} className="w-full sm:w-auto">
                    Go to {userRole} Portal
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Supply Chain Workflow */}
        <Card className="max-w-6xl mx-auto mb-12 sm:mb-16">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl">3-Level Supply Chain Workflow</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Seamless product flow from manufacturing to retail
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Factory className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2 text-blue-600 text-sm sm:text-base">1. Manufacturer</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Create products and assign to distributors using searchable dropdown
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Generate product batches</p>
                  <p>• Select distributor partners</p>
                  <p>• Track assignments</p>
                </div>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2 text-green-600 text-sm sm:text-base">2. Distributor</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Receive from manufacturers and forward to retailers
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Manage inventory</p>
                  <p>• Select retailer partners</p>
                  <p>• Coordinate logistics</p>
                </div>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2 text-purple-600 text-sm sm:text-base">3. Retailer</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Receive products and view complete supply chain journey
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Track received products</p>
                  <p>• View supply chain path</p>
                  <p>• Manage inventory</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          <Card className="text-center">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <Factory className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{counts.manufacturers}</div>
              <div className="text-xs sm:text-sm text-gray-600">Manufacturers</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-green-600">{counts.distributors}</div>
              <div className="text-xs sm:text-sm text-gray-600">Distributors</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{counts.retailers}</div>
              <div className="text-xs sm:text-sm text-gray-600">Retailers</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <Network className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{counts.totalEntities}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Network</div>
            </CardContent>
          </Card>
        </div>


        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader className="px-4 sm:px-6">
              <div className="flex justify-center mb-4">
                <Users className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600" />
              </div>
              <CardTitle className="text-blue-600 text-sm sm:text-base lg:text-lg">
                Searchable Partner Selection
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Find and connect with supply chain partners using advanced search and filtering
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader className="px-4 sm:px-6">
              <div className="flex justify-center mb-4">
                <Network className="h-8 w-8 sm:h-12 sm:w-12 text-green-600" />
              </div>
              <CardTitle className="text-green-600 text-sm sm:text-base lg:text-lg">Connection Path Tracking</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Visualize complete supply chain connections from manufacturer to retailer
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader className="px-4 sm:px-6">
              <div className="flex justify-center mb-4">
                <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600" />
              </div>
              <CardTitle className="text-purple-600 text-sm sm:text-base lg:text-lg">
                Secure Blockchain Network
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Role-based access control with wallet authentication and verification
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
