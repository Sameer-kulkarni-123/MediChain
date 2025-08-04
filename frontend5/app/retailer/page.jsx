"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Store,
  ArrowLeft,
  Shield,
  CheckCircle,
  Package,
  Truck,
  Factory,
  Search,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  retailerReceivedCrate,
  getCrateInfo,
  getAccount,
  retailerReceivedSubCrate,
  getSubCrateInfo,
  getAllBottlesOfCrate, 
  getAllBottlesOfSubCrate
  // activateCertifications,
} from "../../apis"
import { createOrder, getRetailerInventory, updateInventoryItem, updateProductLocation, updateRetailerInventoryItem, optimizeSupplyPath } from "../../api_local"
import { map } from "zod"

export default function RetailerPortal() {
  const [crateCode, setCrateCode] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [deliveryAcknowledged, setDeliveryAcknowledged] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCertActivated, setIsCertActivated] = useState(false)
  const [medicineName, setMedicineName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [trigger, settrigger] = useState(false);
  const [ connectedAccount, setconnectedAccount ] = useState("")
  const [retrievedInventory, setretrievedInventory] = useState();

  // useEffect(() => {
  //   const cAccount = getAccount()
  //   setconnectedAccount(cAccount)
  
  //   return () => {
  //   }
  // }, [])
  


  

  // Original inventory data
  const originalInventory = [
    {
      id: 1,
      medicineName: "Paracetamol 500mg",
      productId: "PAR-500-001",
      quantityInStock: 150,
      soldQuantity: "",
    },
    {
      id: 2,
      medicineName: "Ibuprofen 200mg",
      productId: "IBU-200-002",
      quantityInStock: 75,
      soldQuantity: "",
    },
    {
      id: 3,
      medicineName: "Amoxicillin 250mg",
      productId: "AMX-250-003",
      quantityInStock: 200,
      soldQuantity: "",
    },
    {
      id: 4,
      medicineName: "Aspirin 100mg",
      productId: "ASP-100-004",
      quantityInStock: 120,
      soldQuantity: "",
    },
    {
      id: 5,
      medicineName: "Metformin 500mg",
      productId: "MET-500-005",
      quantityInStock: 90,
      soldQuantity: "",
    },
    {
      id: 6,
      medicineName: "Omeprazole 20mg",
      productId: "OME-020-006",
      quantityInStock: 180,
      soldQuantity: "",
    },
    {
      id: 7,
      medicineName: "Atorvastatin 10mg",
      productId: "ATO-010-007",
      quantityInStock: 65,
      soldQuantity: "",
    },
    {
      id: 8,
      medicineName: "Lisinopril 5mg",
      productId: "LIS-005-008",
      quantityInStock: 110,
      soldQuantity: "",
    },
    {
      id: 9,
      medicineName: "Metoprolol 25mg",
      productId: "MET-025-009",
      quantityInStock: 85,
      soldQuantity: "",
    },
    {
      id: 10,
      medicineName: "Amlodipine 5mg",
      productId: "AML-005-010",
      quantityInStock: 95,
      soldQuantity: "",
    },
    {
      id: 11,
      medicineName: "Simvastatin 20mg",
      productId: "SIM-020-011",
      quantityInStock: 140,
      soldQuantity: "",
    },
    {
      id: 12,
      medicineName: "Losartan 50mg",
      productId: "LOS-050-012",
      quantityInStock: 70,
      soldQuantity: "",
    },
    {
      id: 13,
      medicineName: "Hydrochlorothiazide 25mg",
      productId: "HCT-025-013",
      quantityInStock: 160,
      soldQuantity: "",
    },
    {
      id: 14,
      medicineName: "Gabapentin 300mg",
      productId: "GAB-300-014",
      quantityInStock: 55,
      soldQuantity: "",
    },
    {
      id: 15,
      medicineName: "Sertraline 50mg",
      productId: "SER-050-015",
      quantityInStock: 80,
      soldQuantity: "",
    },
    {
      id: 16,
      medicineName: "Fluoxetine 20mg",
      productId: "FLU-020-016",
      quantityInStock: 125,
      soldQuantity: "",
    },
    {
      id: 17,
      medicineName: "Citalopram 20mg",
      productId: "CIT-020-017",
      quantityInStock: 45,
      soldQuantity: "",
    },
    {
      id: 18,
      medicineName: "Tramadol 50mg",
      productId: "TRA-050-018",
      quantityInStock: 100,
      soldQuantity: "",
    },
    {
      id: 19,
      medicineName: "Codeine 30mg",
      productId: "COD-030-019",
      quantityInStock: 60,
      soldQuantity: "",
    },
    {
      id: 20,
      medicineName: "Diazepam 5mg",
      productId: "DIA-005-020",
      quantityInStock: 35,
      soldQuantity: "",
    },
  ]

  const [inventory, setInventory] = useState([])
  const [isUpdatingInventory, setIsUpdatingInventory] = useState(false)

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("original") // "original", "quantity-low", "quantity-high"
  const [isColdStorage, setIsColdStorage] = useState(false);
  const [optimizerResult, setOptimizerResult] = useState(null);
  const [showPartialOptions, setShowPartialOptions] = useState(false);
  const [showPathDetails, setShowPathDetails] = useState(false);
  const [partialOrderHandlers, setPartialOrderHandlers] = useState(null);




  const { toast } = useToast()

    useEffect(() => {
    const retrieveInventory = async () => {
      const cAccount = await getAccount()
      console.log("cAccount : ", cAccount)
      const rInventory = await getRetailerInventory(cAccount)
      console.log("this is the rInventory : ", rInventory.data)

      const inventoryWithSoldQuantity = rInventory.data.map(item => ({
          ...item,
          soldQuantity: ""
        }))


      setInventory(inventoryWithSoldQuantity)
    }
    retrieveInventory()
    return () => {
      // second
    }
  }, [trigger])

  // Filtered and sorted inventory
  // const filteredAndSortedInventory = useMemo(() => {
  //   let filtered = [...inventory]

  //   // Apply filters - search in both medicine name and product ID
  //   if (searchTerm.trim()) {
  //     const searchLower = searchTerm.toLowerCase()
  //     filtered = filtered.filter(
  //       (item) =>
  //         item.medicineName.toLowerCase().includes(searchLower) || item.productId.toLowerCase().includes(searchLower),
  //     )
  //   }

  //   // Apply sorting
  //   switch (sortBy) {
  //     case "quantity-low":
  //       filtered.sort((a, b) => a.quantityInStock - b.quantityInStock)
  //       break
  //     case "quantity-high":
  //       filtered.sort((a, b) => b.quantityInStock - a.quantityInStock)
  //       break
  //     case "original":
  //     default:
  //       // Sort by original order (by id)
  //       filtered.sort((a, b) => a.id - b.id)
  //       break
  //   }

  //   return filtered
  // }, [inventory, searchTerm, sortBy])

  // Reset filters and sorting
  const resetFiltersAndSort = () => {
    setSearchTerm("")
    setSortBy("original")
    toast({
      title: "Filters Reset",
      description: "All filters and sorting have been reset to default",
    })
  }

  // Mock crate journey data
  const crateJourney = {
    crateCode: "BFIT0",
    medicineName: "Paracetamol 500mg",
    batchId: "B001",
    bottleCount: 100,
    stages: [
      {
        stage: "Manufacturing",
        icon: Factory,
        status: "completed",
        timestamp: "2024-01-15 10:30 AM",
        location: "PharmaCorp Manufacturing Facility",
        details: "Crate manufactured and quality tested",
      },
      {
        stage: "Distribution",
        icon: Truck,
        status: "completed",
        timestamp: "2024-01-18 02:15 PM",
        location: "MediLogistics Warehouse",
        details: "Stored in temperature-controlled environment",
      },
      {
        stage: "Retail Delivery",
        icon: Store,
        status: "in-progress",
        timestamp: "2024-01-20 09:00 AM",
        location: "HealthMart Pharmacy",
        details: "Ready for final delivery confirmation",
      },
    ],
  }

  const verifyCrate = async () => {
    if (!crateCode) {
      toast({
        title: "Error",
        description: "Please enter a crate code to verify",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)

    try {
      // Get crate data from blockchain
      const crateData = await getCrateInfo(crateCode)

      if (crateData && crateData.exists) {
        setIsVerified(true)
        toast({
          title: "Verification Successful",
          description: "Crate authenticity confirmed on blockchain",
        })
      } else {
        toast({
          title: "Verification Failed",
          description: "Crate code not found or invalid",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `${error}`,
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const confirmDelivery = async () => {
    if (!deliveryAcknowledged) {
      toast({
        title: "Error",
        description: "Please acknowledge delivery before confirming",
        variant: "destructive",
      })
      return
    }

    try {
      // Mark crate as received by retailer (final destination)
      if (crateCode.length === 5) {
        await retailerReceivedCrate(crateCode)

        const bottleIds = await getAllBottlesOfCrate(crateCode) 
        const crateInfo = await getCrateInfo(crateCode) 
        const connectedAccount = await getAccount()

        const location = { 
          "type" : "retailer",
          "walletAddress" : connectedAccount
        }


        bottleIds.map( async (bottleId) => {
          await updateProductLocation(bottleId, location, false)
        })

        // console.log("crateInfo", crateInfo)
        // console.log("crateInfo.medicineName inside try", crateInfo[1])

        // await updateProductLocation("P001", location, true)
        await updateRetailerInventoryItem(
          connectedAccount,
          crateInfo[1],
          bottleIds.length,
          null,
          bottleIds,
          "add",
        )



      } else if (crateCode.length === 11) {
        await retailerReceivedSubCrate(crateCode)

        const bottleIds = await getAllBottlesOfSubCrate(crateCode)
        const subCrateInfo = await getSubCrateInfo(crateCode)
        const connectedAccount = await getAccount()

        const location = { 
          "type" : "retailer",
          "walletAddress" : connectedAccount
        }
        bottleIds.map( async (bottleId) => {
          await updateProductLocation(bottleId, location, false)
        })

        await updateRetailerInventoryItem(
          connectedAccount,
          subCrateInfo[1],
          bottleIds.length,
          null,
          bottleIds,
          "add",
        )

        settrigger(!trigger)

        
      } else {
        toast({
          title: "Error",
          description: "Invalid crate code format. Please enter a valid code.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Delivery Confirmed",
        description: "Final delivery status updated on blockchain",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `${error}`,
        variant: "destructive",
      })
    }
  }

  // const handleActivateCert = async () => {
  //   try {
  //     await activateCertifications(crateCode)
  //     setIsCertActivated(true)
  //     toast({
  //       title: "Certifications Activated",
  //       description: "Retailer successfully activated crate certifications",
  //     })
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to activate certifications",
  //       variant: "destructive",
  //     })
  //   }
  // }

  const handlePlaceOrder = async () => {
    if (!medicineName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a medicine name",
        variant: "destructive",
      });
      return;
    }
  
    if (!quantity || Number.parseInt(quantity) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }
  
    setIsPlacingOrder(true);
    try {
      const account = await getAccount();
      const requiredQty = Number.parseInt(quantity);
  
      // 1️⃣ Call optimizer
      const optimizerRes = await optimizeSupplyPath(
        medicineName.trim(),
        requiredQty,
        account,
        isColdStorage
      );
  
      const optimizerData = optimizerRes.data;
  
      // 2️⃣ Show path data (always)
      setOptimizerResult(optimizerData);
      setShowPathDetails(true);
  
      // 3️⃣ Build order data helper
      const buildOrderData = () => {
        return {
          retailerWalletAddress: account,
          status: "created",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lineItems: [
            {
              productName: medicineName.trim(),
              qty: optimizerData.allocations.reduce((sum, a) => sum + a.allocated_qty, 0),
              allocations: optimizerData.allocations.map((alloc) => ({
                qty: alloc.allocated_qty,
                batchId: "",
                productUnitIds: alloc.product_ids,
                currentStage: 0,
                fulfilled: false,
                path: [
                  {
                    fromType: "distributor",
                    fromWalletAddress: alloc.path[0],
                    toType: "retailer",
                    toWalletAddress: alloc.path[alloc.path.length - 1],
                    etaDays: alloc.eta_time,
                  },
                ],
              })),
            },
          ],
        };
      };
      
  
      if (optimizerData.status === "complete") {
        // 4️⃣ Complete order - log payload
        const orderData = buildOrderData();
        console.log("Sending Complete Order Data:", JSON.stringify(orderData, null, 2));
  
        await createOrder(orderData);
  
        toast({
          title: "Order Placed Successfully",
          description: `Order for ${requiredQty} units of ${medicineName} has been placed.`,
        });
  
        // Reset fields
        setMedicineName("");
        setQuantity("");
        setIsColdStorage(false);
      } else {
        // 5️⃣ Partial order
        setShowPartialOptions(true);
  
        const handleAcceptPartial = async () => {
          const orderData = buildOrderData();
          console.log("📦 Sending Partial Order Data:", JSON.stringify(orderData, null, 2));
  
          await createOrder(orderData);
  
          toast({
            title: "Partial Order Placed",
            description: `Order placed for available quantity only.`,
          });
  
          setOptimizerResult(null);
          setShowPartialOptions(false);
          setMedicineName("");
          setQuantity("");
        };
  
        const handleCancelOrder = () => {
          setOptimizerResult(null);
          setShowPartialOptions(false);
        };
  
        setPartialOrderHandlers({ handleAcceptPartial, handleCancelOrder });
      }
    } catch (error) {
      console.error("❌ Error placing order:", error.response?.data || error.message);
      toast({
        title: "Error",
        description: `Failed to place order: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };
  

  const handleUpdateInventory = async (itemMedicineName, soldQuantity) => {
    if (!soldQuantity || Number.parseInt(soldQuantity) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid sold quantity",
        variant: "destructive",
      })
      return
    }

    const item = inventory.find((inv) => inv.medicineName === itemMedicineName)
    if (!item) {
      toast({
        title: "Error",
        description: "Inventory item not found",
        variant: "destructive",
      })
      return
    }

    const soldQty = Number.parseInt(soldQuantity)
    if (soldQty > item.qtyRemaining) {
      toast({
        title: "Error",
        description: `Cannot sell ${soldQty} units. Only ${item.qtyRemaining} units available in stock.`,
        variant: "destructive",
      })
      return
    }

    setIsUpdatingInventory(true)
    try {
      const account = await getAccount()
      const newQuantity = item.qtyRemaining - soldQty

      // Here you would call the actual API to update inventory
      // For now, we'll simulate the update locally
      // await updateRetailerInventoryItem(account, item.medicineName, newQuantity)

      // Update local state
      // setInventory((prev) =>
      //   prev.map((inv) => (inv.MedicineName === itemMedicineName ? { ...inv, quantityInStock: newQuantity, soldQuantity: "" } : inv)),
      // )
      //=========================
      //call the actual db api here
      //=========================

      

      settrigger(!trigger)
      toast({
        title: "Sale Recorded Successfully",
        description: `${soldQty} units of ${item.medicineName} sold. New stock: ${newQuantity} units`,
      })
    } catch (error) {
      console.error("Error updating inventory:", error)
      toast({
        title: "Error",
        description: `Failed to record sale: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingInventory(false)
    }
  }

  const handleSoldQuantityChange = (itemMedicineName, value) => {
    setInventory((prev) => prev.map((inv) => (inv.medicineName === itemMedicineName ? { ...inv, soldQuantity: value } : inv)))
    // call the actual update db api here
    settrigger(!trigger)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Retailer Portal</h1>
              <p className="text-gray-600">Verify authenticity and confirm final delivery</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Crate Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Crate Verification
              </CardTitle>
              <CardDescription>Verify crate authenticity using blockchain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="crateCode">Crate Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="crateCode"
                    value={crateCode}
                    onChange={(e) => setCrateCode(e.target.value)}
                    placeholder="Enter crate code (e.g., MC-1704123456-7890)"
                  />
                </div>
              </div>

              {isVerified && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Verification Successful</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">Crate authenticity confirmed on blockchain</p>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox id="delivery-ack" checked={deliveryAcknowledged} onCheckedChange={setDeliveryAcknowledged} />
                <Label htmlFor="delivery-ack" className="text-sm">
                  I acknowledge that the medical crate has been received in good condition
                </Label>
              </div>
              <Button
                onClick={confirmDelivery}
                disabled={!deliveryAcknowledged || isVerified}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Confirm Final Delivery
              </Button>
              {/* {isVerified && deliveryAcknowledged && (
                <Button
                  onClick={handleActivateCert}
                  disabled={isCertActivated}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isCertActivated ? "✅ Certifications Activated" : "Activate Certifications"}
                </Button>
              )} */}

              {isVerified && <p className="text-sm text-gray-500">Please verify crate authenticity first</p>}
            </CardContent>
          </Card>

          {/* Place Order */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Place Order
              </CardTitle>
              <CardDescription>Order medicines from the supply chain network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="medicineName">Medicine Name</Label>
                <Input
                  id="medicineName"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="Enter medicine name (e.g., Paracetamol 500mg)"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="coldStorage"
                  checked={isColdStorage}
                  onChange={(e) => setIsColdStorage(e.target.checked)}
                />
                <Label htmlFor="coldStorage">Requires Cold Storage?</Label>
              </div>


              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || !medicineName.trim() || !quantity || Number.parseInt(quantity) <= 0}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isPlacingOrder ? "Placing Order..." : "Place Order"}
              </Button>

              {medicineName && quantity && Number.parseInt(quantity) > 0 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <span className="font-medium">Order Summary:</span> {quantity} units of {medicineName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {optimizerResult && (
  <div
    className={`p-3 border rounded-lg mt-4 ${
      optimizerResult.status === "partial"
        ? "bg-yellow-50 border-yellow-200"
        : "bg-green-50 border-green-200"
    }`}
  >
    {optimizerResult.status === "partial" && (
      <p className="text-sm text-yellow-800 mb-2">
        <span className="font-medium">Notice:</span>{" "}
        {optimizerResult.wait_recommendation?.message}
      </p>
    )}

    <div className="mt-2">
      <p className="font-medium text-purple-900">Optimal Path Allocations:</p>
      <ul className="list-disc list-inside text-purple-800 text-sm">
        {optimizerResult.allocations.map((alloc, idx) => (
          <li key={idx}>
            <span className="font-semibold">Source:</span> {alloc.source} →{" "}
            <span className="font-semibold">ETA:</span> {alloc.eta_time} days,{" "}
            <span className="font-semibold">Qty:</span> {alloc.allocated_qty}
          </li>
        ))}
      </ul>
    </div>

    {/* Buttons only for partial */}
    {optimizerResult.status === "partial" && (
      <div className="flex gap-4 mt-4">
        {/* Accept Partial Order */}
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={async () => {
            const account = await getAccount();

            // Build order details properly
            const allEtas = optimizerResult.allocations.map((a) => a.eta_time);
            const overallEta = allEtas.length > 0 ? Math.max(...allEtas) : 0;

            const orderData = {
              retailerWalletAddress: account,
              status: "created",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lineItems: {
                productName: medicineName.trim(),
                qty: optimizerResult.allocations.reduce(
                  (sum, alloc) => sum + alloc.allocated_qty,
                  0
                ),
                batchId: "",
                allocatedQty: optimizerResult.allocations.reduce(
                  (sum, alloc) => sum + alloc.allocated_qty,
                  0
                ),
                overallEta,
                allocations: optimizerResult.allocations.map((alloc) => ({
                  productUnitIds: alloc.product_ids,
                  sourceWalletAddress: alloc.source,
                  sourceType: "distributor",
                  etaDays: alloc.eta_time,
                  fulfilled: false,
                  currentStage: 0,
                  path: {
                    fromWalletAddress: alloc.path[0],
                    fromType: "distributor",
                    toWalletAddress: alloc.path[alloc.path.length - 1],
                    toType: "retailer",
                    etaDays: alloc.eta_time,
                  },
                })),
              },
            };

            await createOrder(orderData);

            toast({
              title: "Partial Order Placed",
              description: `Order placed for available quantity only.`,
            });

            setOptimizerResult(null);
            setShowPartialOptions(false);
            setMedicineName("");
            setQuantity("");
          }}
        >
          Accept Partial Order
        </Button>

        {/* Cancel Order */}
        <Button
          variant="destructive"
          onClick={() => {
            setOptimizerResult(null);
            setShowPartialOptions(false);
          }}
        >
          Cancel
        </Button>
      </div>
    )}
  </div> // <--- This closes the outer div of optimizerResult
)}



        </div>
        {/* Current Inventory Table */}
        <Card className="mt-8 min-h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Current Inventory
            </CardTitle>
            <CardDescription>Record medicine sales and manage your current inventory stock levels</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter and Sort Controls */}
            {/* <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> */}
                {/* Search Input */}
                {/* <div className="md:col-span-2">
                  <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search medicines or product IDs..."
                      className="pl-10"
                    />
                  </div>
                </div> */}

                {/* Sort By */}
                {/* <div>
                  <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original Order</SelectItem>
                      <SelectItem value="quantity-low">Quantity: Low to High</SelectItem>
                      <SelectItem value="quantity-high">Quantity: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div> */}

              {/* Control Buttons */}
              {/* <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  onClick={resetFiltersAndSort}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset All
                </Button> */}

                {/* Active Filters Display */}
                {/* <div className="flex flex-wrap gap-2 items-center">
                  {searchTerm && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Search: "{searchTerm}"
                      <button onClick={() => setSearchTerm("")} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                        ×
                      </button>
                    </Badge>
                  )}
                  {sortBy !== "original" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3" />
                      {sortBy === "quantity-low" ? "Low to High" : "High to Low"}
                    </Badge>
                  )}
                </div>
              </div> */}

              {/* Results Count */}
              {/* <div className="mt-2 text-sm text-gray-600">
                Showing {filteredAndSortedInventory.length} of {inventory.length} items
              </div>
            </div> */}

            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10 border-b-2">
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-900">Sl. No.</th>
                      <th className="text-left p-3 font-medium text-gray-900">Medicine Name</th>
                      {/* <th className="text-left p-3 font-medium text-gray-900">Product ID</th> */}
                      <th className="text-left p-3 font-medium text-gray-900">Quantity in Stock</th>
                      <th className="text-left p-3 font-medium text-gray-900">Units Sold</th>
                      <th className="text-left p-3 font-medium text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-gray-700">{index + 1}</td>
                        <td className="p-3 text-gray-900 font-medium">{item.productName}</td>
                        {/* <td className="p-3 text-gray-700 font-mono text-sm">{item.productId}</td> */}
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={`${
                              item.qtyRemaining < item.reorderLevel
                                ? "text-red-600 border-red-600"
                                  : "text-green-600 border-green-600"
                            }`}
                          >
                            {item.qtyRemaining} units
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="1"
                            max={item.qtyRemaining}
                            value={item.soldQuantity}
                            onChange={(e) => handleSoldQuantityChange(item.medicineName, e.target.value)}
                            placeholder="Units sold"
                            className="w-32"
                          />
                        </td>
                        <td className="p-3">
                          <Button
                            onClick={() => handleUpdateInventory(item.medicineName, item.soldQuantity)}
                            disabled={
                              isUpdatingInventory ||
                              !item.soldQuantity ||
                              Number.parseInt(item.soldQuantity) <= 0 ||
                              Number.parseInt(item.soldQuantity) > item.quantityInStock
                            }
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {isUpdatingInventory ? "Recording..." : "Record Sale"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {inventory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No inventory items found matching your criteria</p>
                <Button onClick={resetFiltersAndSort} variant="outline" className="mt-2 bg-transparent">
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Crate Journey */}
        {isVerified && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Complete Crate Journey
              </CardTitle>
              <CardDescription>Track the complete journey from manufacturer to retailer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Crate Code:</span>
                    <p className="font-mono">{crateJourney.crateCode}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Medicine:</span>
                    <p>{crateJourney.medicineName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Batch ID:</span>
                    <p>{crateJourney.batchId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Bottle Count:</span>
                    <p>{crateJourney.bottleCount}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {crateJourney.stages.map((stage, index) => {
                  const Icon = stage.icon
                  return (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div
                        className={`p-2 rounded-full ${
                          stage.status === "completed"
                            ? "bg-green-100"
                            : stage.status === "in-progress"
                              ? "bg-blue-100"
                              : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            stage.status === "completed"
                              ? "text-green-600"
                              : stage.status === "in-progress"
                                ? "text-blue-600"
                                : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{stage.stage}</h3>
                          <Badge
                            variant="outline"
                            className={
                              stage.status === "completed"
                                ? "text-green-600 border-green-600"
                                : stage.status === "in-progress"
                                  ? "text-blue-600 border-blue-600"
                                  : "text-gray-600 border-gray-600"
                            }
                          >
                            {stage.status === "completed"
                              ? "Completed"
                              : stage.status === "in-progress"
                                ? "In Progress"
                                : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{stage.timestamp}</p>
                        <p className="text-sm font-medium text-gray-800">{stage.location}</p>
                        <p className="text-sm text-gray-600">{stage.details}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
