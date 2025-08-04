import axios from "axios";

/* ==============================
   Base URLs
============================== */
const CONNECTIONS_BASE = "http://localhost:8000/connections";
const DISTRIBUTORS_BASE = "http://localhost:8000/distributors";
const MANUFACTURERS_BASE = "http://localhost:8000/manufacturers";
const ORDERS_BASE = "http://localhost:8000/orders";
const PRODUCTS_BASE = "http://localhost:8000/products";
const RETAILERS_BASE = "http://localhost:8000/retailers";
const OPTIMIZER_BASE = `http://localhost:8000`;
const GENERATEQR_BASE = "http://localhost:8000/generateqr";





/* ==============================
   CONNECTIONS API FUNCTIONS
============================== */

/**
 * Add a new connection.
 * 
 * @param {Object} data - ConnectionModel data:
 * @param {string} data.fromWalletAddress - Wallet address of source entity.
 * @param {"manufacturer"|"distributor"|"retailer"} data.fromType - Source type.
 * @param {string} data.toWalletAddress - Wallet address of destination entity.
 * @param {"manufacturer"|"distributor"|"retailer"} data.toType - Destination type.
 * @param {number} [data.distanceKm] - Distance in km.
 * @param {number} [data.transitTimeDays] - Transit time in days.
 * @param {number} [data.costPerUnit] - Cost per unit shipped.
 * @param {boolean} [data.active=true] - Active status.
 * 
 * @returns {Promise} Axios response.
 */
export const addConnection = (data) => axios.post(`${CONNECTIONS_BASE}/`, data);

/**
 * Get all connections (with optional type filters).
 * 
 * @param {string|null} fromType - Optional fromType filter.
 * @param {string|null} toType - Optional toType filter.
 * 
 * @returns {Promise} Axios response with list of connections.
 */
export const getAllConnections = (fromType = null, toType = null) => {
  let url = `${CONNECTIONS_BASE}/all`;
  const params = {};
  if (fromType) params.from_type = fromType;
  if (toType) params.to_type = toType;

  return axios.get(url, { params });
};

/**
 * Get all connections starting from a wallet.
 * 
 * @param {string} fromWalletAddress - Source wallet address.
 * @param {string|null} toType - Optional destination type filter.
 * 
 * @returns {Promise} Axios response.
 */
export const getConnectionsFrom = (fromWalletAddress, toType = null) => {
  const params = {};
  if (toType) params.to_type = toType;
  return axios.get(`${CONNECTIONS_BASE}/from/${fromWalletAddress}`, { params });
};

/**
 * Get all connections going to a wallet.
 * 
 * @param {string} toWalletAddress - Destination wallet address.
 * @param {string|null} fromType - Optional source type filter.
 * 
 * @returns {Promise} Axios response.
 */
export const getConnectionsTo = (toWalletAddress, fromType = null) => {
  const params = {};
  if (fromType) params.from_type = fromType;
  return axios.get(`${CONNECTIONS_BASE}/to/${toWalletAddress}`, { params });
};

/**
 * Get all connections for a specific wallet (incoming & outgoing).
 * 
 * @param {string} walletAddress - Wallet address of the entity.
 * 
 * @returns {Promise} Axios response.
 */
export const getConnectionsForEntity = (walletAddress) =>
  axios.get(`${CONNECTIONS_BASE}/all/${walletAddress}`);

/**
 * Update an existing connection.
 * 
 * @param {string} fromWalletAddress - Source wallet address.
 * @param {string} toWalletAddress - Destination wallet address.
 * @param {Object} updateData - Partial<ConnectionUpdateModel> data.
 * 
 * @returns {Promise} Axios response.
 */
export const updateConnection = (fromWalletAddress, toWalletAddress, updateData) =>
  axios.patch(`${CONNECTIONS_BASE}/${fromWalletAddress}/${toWalletAddress}`, updateData);

/**
 * Delete a connection.
 * 
 * @param {string} fromWalletAddress - Source wallet address.
 * @param {string} toWalletAddress - Destination wallet address.
 * 
 * @returns {Promise} Axios response.
 */
export const deleteConnection = (fromWalletAddress, toWalletAddress) =>
  axios.delete(`${CONNECTIONS_BASE}/${fromWalletAddress}/${toWalletAddress}`);

/**
 * Get the full connection graph (adjacency list).
 * 
 * @returns {Promise} Axios response.
 */
export const getConnectionsGraph = () => axios.get(`${CONNECTIONS_BASE}/graph`);


/* ==============================
   DISTRIBUTORS API FUNCTIONS
============================== */

/**
 * Add a new distributor.
 * 
 * @param {Object} data - DistributorModel data.
 * @returns {Promise} Axios response.
 */
export const addDistributor = (data) => axios.post(`${DISTRIBUTORS_BASE}/`, data);

/**
 * Get all distributors.
 * 
 * @returns {Promise} Axios response with distributor list.
 */
export const getAllDistributors = () => axios.get(`${DISTRIBUTORS_BASE}/`);

/**
 * Get distributor by wallet address.
 * 
 * @param {string} walletAddress - Distributor wallet address.
 * @returns {Promise} Axios response.
 */
export const getDistributor = (walletAddress) => axios.get(`${DISTRIBUTORS_BASE}/${walletAddress}`);

/**
 * Delete distributor by wallet address.
 * 
 * @param {string} walletAddress - Distributor wallet address.
 * @returns {Promise} Axios response.
 */
export const deleteDistributor = (walletAddress) => axios.delete(`${DISTRIBUTORS_BASE}/${walletAddress}`);

/**
 * Update distributor details.
 * 
 * @param {string} walletAddress - Distributor wallet address.
 * @param {Object} updateData - Partial DistributorUpdateModel data.
 * @returns {Promise} Axios response.
 */
export const updateDistributor = (walletAddress, updateData) =>
  axios.patch(`${DISTRIBUTORS_BASE}/${walletAddress}`, updateData);

/**
 * Get full inventory of a distributor.
 * 
 * @param {string} walletAddress - Distributor wallet address.
 * @returns {Promise} Axios response.
 */
export const getAllInventory = (walletAddress) =>
  axios.get(`${DISTRIBUTORS_BASE}/${walletAddress}/inventory`);

/**
 * Get specific product inventory item of a distributor.
 * 
 * @param {string} walletAddress - Distributor wallet address.
 * @param {string} productName - Product name.
 * @returns {Promise} Axios response.
 */
export const getInventoryItem = (walletAddress, productName) =>
  axios.get(`${DISTRIBUTORS_BASE}/${walletAddress}/inventory/${productName}`);

/**
 * Bulk update distributor inventory.
 * 
 * @param {string} walletAddress - Distributor wallet address.
 * @param {Array<Object>} updates - List of product updates:
 *   [{ productName, qty, productIds, reorderLevel, action: "add"|"remove" }]
 * @returns {Promise} Axios response.
 */
export const bulkUpdateInventory = (walletAddress, updates) =>
  axios.patch(`${DISTRIBUTORS_BASE}/${walletAddress}/inventory/bulk`, updates);

/**
 * Update or add/remove a single inventory item.
 * 
 * @param {string} walletAddress - Distributor wallet address.
 * @param {string} productName - Product name.
 * @param {number} qty - Quantity.
 * @param {string[]} productIds - Product IDs to add/remove.
 * @param {number|null} reorderLevel - Optional reorder level.
 * @param {"add"|"remove"} action - Action type.
 * @returns {Promise} Axios response.
 */
export const updateInventoryItem = (
  walletAddress,
  productName,
  qty,
  productIds = [],
  reorderLevel = null,
  action = "add"
) =>
  axios.patch(`${DISTRIBUTORS_BASE}/${walletAddress}/inventory/${productName}`, {
    qty,
    product_ids: productIds,
    reorder_level: reorderLevel,
    action
  });


  /* ==============================
   MANUFACTURERS API FUNCTIONS
============================== */

/**
 * Add a new manufacturer.
 * 
 * @param {Object} data - ManufacturerModel data:
 * @param {string} data.name - Manufacturer name.
 * @param {string} data.walletAddress - Unique wallet address.
 * @param {Object} data.geo - Geo location {type: "Point", coordinates: [lng, lat]}.
 * @param {Object} data.contacts - Contacts {phone, email}.
 * @param {Array<string>} [data.productsProduced] - List of products manufactured.
 * @param {Array<Object>} data.productionTimes - Production times list:
 *   [{ productName, days }]
 * @param {Array<Object>} data.certificates - Certificates list:
 *   [{ certId, type, issuedBy, validFrom, validTo, fileUrl, imageFileId }]
 * 
 * @returns {Promise} Axios response.
 */
export const addManufacturer = (data) =>
    axios.post(`${MANUFACTURERS_BASE}/`, data);
  
  /**
   * Get all manufacturers.
   * 
   * @returns {Promise} Axios response with list of manufacturers.
   */
  export const getAllManufacturers = () =>
    axios.get(`${MANUFACTURERS_BASE}/`);
  
  /**
   * Get manufacturer by wallet address.
   * 
   * @param {string} walletAddress - Manufacturer wallet address.
   * @returns {Promise} Axios response with manufacturer details.
   */
  export const getManufacturer = (walletAddress) =>
    axios.get(`${MANUFACTURERS_BASE}/${walletAddress}`);
  
  /**
   * Delete a manufacturer by wallet address.
   * 
   * @param {string} walletAddress - Manufacturer wallet address.
   * @returns {Promise} Axios response.
   */
  export const deleteManufacturer = (walletAddress) =>
    axios.delete(`${MANUFACTURERS_BASE}/${walletAddress}`);
  
  /**
   * Update manufacturer details.
   * 
   * @param {string} walletAddress - Manufacturer wallet address.
   * @param {Object} updateData - Partial ManufacturerUpdateModel data:
   *   - name
   *   - address
   *   - walletAddress
   *   - geo
   *   - contacts
   *   - productsProduced
   *   - productionTimes
   *   - certificates
   * 
   * @returns {Promise} Axios response.
   */
  export const updateManufacturer = (walletAddress, updateData) =>
    axios.patch(`${MANUFACTURERS_BASE}/${walletAddress}`, updateData);


  /* ==============================
   ORDERS API FUNCTIONS
============================== */

/**
 * Create a new order.
 *
 * @param {Object} data - OrderModel data:
 * @param {string} data.retailerWalletAddress - Retailer wallet address.
 * @param {Object} data.lineItems - Product info:
 *   {
 *     productName,
 *     qty,
 *     allocations: {
 *       qty,
 *       batchId,
 *       productUnitIds,
 *       currentStage,
 *       fulfilled,
 *       path: { fromType, fromWalletAddress, toType, toWalletAddress, etaDays }
 *     }
 *   }
 * @param {string} [data.status] - Default: "created"
 * @returns {Promise}
 */
export const createOrder = (data) =>
    axios.post(`${ORDERS_BASE}/`, data);
  
  /**
   * Get all orders.
   *
   * @returns {Promise}
   */
  export const getAllOrders = () => axios.get(`${ORDERS_BASE}/`);
  
  /**
   * Get all orders by retailer wallet address.
   *
   * @param {string} retailerWalletAddress
   * @returns {Promise}
   */
  export const getOrdersByRetailer = (retailerWalletAddress) =>
    axios.get(`${ORDERS_BASE}/retailer/${retailerWalletAddress}`);
  
  /**
   * Get all pending orders (global).
   *
   * @returns {Promise}
   */
  export const getAllPendingOrders = () =>
    axios.get(`${ORDERS_BASE}/pending`);
  
  /**
   * Get pending orders for a specific retailer.
   *
   * @param {string} retailerWalletAddress
   * @returns {Promise}
   */
  export const getPendingOrdersByRetailer = (retailerWalletAddress) =>
    axios.get(`${ORDERS_BASE}/pending/${retailerWalletAddress}`);
  
  /**
   * Get one order by orderId.
   *
   * @param {string} orderId
   * @returns {Promise}
   */
  export const getOrder = (orderId) =>
    axios.get(`${ORDERS_BASE}/${orderId}`);
  
  /**
   * Update order details or status.
   *
   * @param {string} orderId
   * @param {Object} updateData - Fields to update
   * @returns {Promise}
   */
  export const updateOrder = (orderId, updateData) =>
    axios.patch(`${ORDERS_BASE}/${orderId}`, updateData);
  
  /**
   * Delete an order by orderId.
   *
   * @param {string} orderId
   * @returns {Promise}
   */
  export const deleteOrder = (orderId) =>
    axios.delete(`${ORDERS_BASE}/${orderId}`);
  
  /**
   * Update allocation fulfillment status (true/false).
   *
   * @param {string} orderId
   * @param {boolean} fulfilled
   * @returns {Promise}
   */
  export const updateAllocation = (orderId, fulfilled) =>
    axios.patch(`${ORDERS_BASE}/${orderId}/allocation`, null, {
      params: { fulfilled },
    });
  
  /**
   * Add path information to a specific allocation in an order.
   *
   * @param {string} orderId
   * @param {number} allocationIndex
   * @param {Array<Object>} pathData - List of path segments:
   * [
   *   {
   *     fromType, fromWalletAddress, toType, toWalletAddress, etaDays, scannedAt
   *   }
   * ]
   * @returns {Promise}
   */
  export const addPathToAllocation = (orderId, allocationIndex, pathData) =>
    axios.patch(
      `${ORDERS_BASE}/${orderId}/allocations/${allocationIndex}/path`,
      pathData
    );
  
  /**
 * Get all orders for a specific distributor.
 *
 * @param {string} distributorWalletAddress
 * @returns {Promise}
 */
export const getOrdersByDistributor = (distributorWalletAddress) =>
  axios.get(`${ORDERS_BASE}/distributor/${distributorWalletAddress}`);

/**
 * Get all pending orders for a specific distributor.
 *
 * @param {string} distributorWalletAddress
 * @returns {Promise}
 */
export const getPendingOrdersByDistributor = (distributorWalletAddress) =>
  axios.get(`${ORDERS_BASE}/pending/distributor/${distributorWalletAddress}`);

/**
 * Get new (created) orders for a specific distributor.
 *
 * @param {string} distributorWalletAddress
 * @returns {Promise}
 */
export const getNewOrdersByDistributor = (distributorWalletAddress) =>
  axios.get(`${ORDERS_BASE}/new/distributor/${distributorWalletAddress}`);

/**
 * Update allocations fulfilled status using product IDs.
 *
 * @param {Array<string>} productIds - List of product IDs to check and update.
 * @returns {Promise}
 */
export const updateAllocationsFulfilledByProducts = (productIds) =>
  axios.patch(`${ORDERS_BASE}/allocations/fulfilled`, productIds);

/**
 * Update order status using product IDs.
 *
 * @param {Array<string>} productIds - List of product IDs.
 * @param {string} status - New status ("created", "in-transit", "completed", "cancelled").
 * @returns {Promise}
 */
export const updateOrderStatusByProducts = (productIds, status) =>
  axios.patch(`${ORDERS_BASE}/status/by-products`, null, {
    params: { product_ids: productIds, status },
  });


// Fulfill allocations for a distributor
export const fulfillAllocations = async (distributor_wallet, order_id) => {
  try {
    const response = await axios.patch("http://localhost:8000/orders/fulfill/data", {
      distributor_wallet,
      order_id
    });
    return response.data;
  } catch (error) {
    console.error("Error fulfilling allocations:", error.response?.data || error.message);
    throw error;
  }
};


// Get pending allocations for a distributor
export const getPendingAllocations = async (distributor_walletAddress) => {
  try {
    const response = await axios.get(
      `http://localhost:8000/orders/pending-allocations/${distributor_walletAddress}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching pending allocations:", error.response?.data || error.message);
    throw error;
  }
};

// ==============================
//   OPTIMIZER API FUNCTIONS
// ==============================

/**
 * Run supply path optimization.
 *
 * @param {string} product_name
 * @param {number} required_qty
 * @param {string} target_wallet
 * @param {boolean} is_cold_storage
 */
export const optimizeSupplyPath = (
  product_name,
  required_qty,
  target_wallet,
  is_cold_storage = false
) =>
  axios.get(`${OPTIMIZER_BASE}/test-optimize`, {
    params: {
      product_name,
      required_qty,
      target_wallet,
      is_cold_storage,
    },
  });

/* ==============================
   PRODUCTS API FUNCTIONS
============================== */

/**
 * Create a new product.
 *
 * @param {Object} data - ProductModel data:
 * {
 *   productId: string,
 *   productName: string,
 *   atcCode?: string,
 *   coldChain?: boolean,
 *   unitWeight?: number|string,
 *   batchId?: string,
 *   location?: { type: "manufacturer"|"distributor"|"retailer", walletAddress: string }
 *   shelf_life?: number
 * }
 * @returns {Promise}
 */
export const createProduct = (data) => axios.post(`${PRODUCTS_BASE}/`, data);

/**
 * Get all products.
 *
 * @returns {Promise}
 */
export const getAllProducts = () => axios.get(`${PRODUCTS_BASE}/`);

/**
 * Get products by location (entity type and wallet address).
 *
 * @param {string} entityType - "manufacturer" | "distributor" | "retailer"
 * @param {string} entityWalletAddress
 * @returns {Promise}
 */
export const getProductsByLocation = (entityType, entityWalletAddress) =>
  axios.get(`${PRODUCTS_BASE}/location/${entityType}/${entityWalletAddress}`);

/**
 * Get products currently in transit.
 *
 * @returns {Promise}
 */
export const getProductsInTransit = () => axios.get(`${PRODUCTS_BASE}/transit`);

/**
 * Get products by batchId.
 *
 * @param {string} batchId
 * @returns {Promise}
 */
export const getProductsByBatch = (batchId) =>
  axios.get(`${PRODUCTS_BASE}/batch/${batchId}`);

/**
 * Search products by productName (case-insensitive).
 *
 * @param {string} name
 * @returns {Promise}
 */
export const searchProductsByName = (name) =>
  axios.get(`${PRODUCTS_BASE}/search/${name}`);

/**
 * Get a single product by productId.
 *
 * @param {string} productId
 * @returns {Promise}
 */
export const getProductById = (productId) =>
  axios.get(`${PRODUCTS_BASE}/${productId}`);

/**
 * Update a product's location and inTransit status.
 *
 * @param {string} productId
 * @param {Object} location - { type: "manufacturer"|"distributor"|"retailer", walletAddress: string }
 * @param {boolean} [inTransit=false]
 * @returns {Promise}
 */
export const updateProductLocation = (productId, location, inTransit = false) =>
  axios.patch(`${PRODUCTS_BASE}/${productId}/location`, location, {
    params: { in_transit: inTransit },
  });

/**
 * Delete a product by productId.
 *
 * @param {string} productId
 * @returns {Promise}
 */
export const deleteProduct = (productId) =>
  axios.delete(`${PRODUCTS_BASE}/${productId}`);

/* ==============================
   RETAILERS API FUNCTIONS
============================== */

/**
 * Add a new retailer.
 * @param {Object} data - RetailerModel data.
 */
export const addRetailer = (data) => axios.post(`${RETAILERS_BASE}/`, data);

/**
 * Get all retailers.
 */
export const getAllRetailers = () => axios.get(`${RETAILERS_BASE}/`);

/**
 * Get one retailer by wallet address.
 * @param {string} walletAddress
 */
export const getRetailerByWallet = (walletAddress) =>
  axios.get(`${RETAILERS_BASE}/${walletAddress}`);

/**
 * Delete a retailer by wallet address.
 * @param {string} walletAddress
 */
export const deleteRetailer = (walletAddress) =>
  axios.delete(`${RETAILERS_BASE}/${walletAddress}`);

/**
 * Update a retailer.
 * @param {string} walletAddress
 * @param {Object} data - RetailerUpdateModel
 */
export const updateRetailer = (walletAddress, data) =>
  axios.patch(`${RETAILERS_BASE}/${walletAddress}`, data);

/* ------- INVENTORY MANAGEMENT ------- */

/**
 * Get full inventory for a retailer.
 * @param {string} walletAddress
 */
export const getRetailerInventory = (walletAddress) =>
  axios.get(`${RETAILERS_BASE}/${walletAddress}/inventory`);

/**
 * Get one inventory item by product name.
 * @param {string} walletAddress
 * @param {string} productName
 */
export const getRetailerInventoryItem = (walletAddress, productName) =>
  axios.get(`${RETAILERS_BASE}/${walletAddress}/inventory/${productName}`);
/**
 * Bulk update retailer inventory with add/remove actions.
 * 
 * @param {string} walletAddress
 * @param {Array} updates - [{ productName, qty, productIds, reorderLevel, action }]
 */
export const bulkUpdateRetailerInventory = (walletAddress, updates) =>
  axios.patch(`${RETAILERS_BASE}/${walletAddress}/inventory/bulk`, updates);

/**
 * Update one inventory item (add or remove).
 * 
 * @param {string} walletAddress
 * @param {string} productName
 * @param {number} qty
 * @param {number|null} reorderLevel
 * @param {Array<string>} productIds
 * @param {"add"|"remove"} action
 */
export const updateRetailerInventoryItem = (
  walletAddress,
  productName,
  qty,
  reorderLevel = null,
  productIds = [],
  action = "add"
) =>
  axios.patch(
    `${RETAILERS_BASE}/${walletAddress}/inventory/${productName}`,
    {
      qty,
      reorderLevel,
      productIds,
      action
    }
  );

/** 
@param {Array<string>} bottleIds
*/
export const generateQR = (
  bottleIds = []
) => 
  axios.post(`${GENERATEQR_BASE}`,  bottleIds)
