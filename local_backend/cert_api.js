import axios from "axios";

const CERTIFICATES_BASE = "http://localhost:8000/certificates";

/**
 * Upload a new certificate for a manufacturer.
 * 
 * @param {string} walletAddress - Manufacturer wallet address.
 * @param {Object} certData - Certificate metadata:
 * @param {string} certData.type - Certificate type (e.g., ISO-9001)
 * @param {string} certData.issuedBy - Issuing authority
 * @param {string} certData.validFrom - Valid from (ISO date string)
 * @param {string} certData.validTo - Valid to (ISO date string)
 * @param {File} file - Certificate image file
 * 
 * @returns {Promise} Axios response.
 */
export const uploadCertificate = async (walletAddress, certData, file) => {
  const formData = new FormData();
  formData.append("cert_data", JSON.stringify(certData));
  formData.append("file", file);

  return axios.post(`${CERTIFICATES_BASE}/${walletAddress}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * Get the latest certificate image for a manufacturer.
 * 
 * @param {string} walletAddress - Manufacturer wallet address.
 * @returns {Promise} Axios response (returns the image as a blob).
 */
export const getLatestCertificateImage = async (walletAddress) => {
  return axios.get(`${CERTIFICATES_BASE}/${walletAddress}/latest`, {
    responseType: "blob", // because it's an image
  });
};

/**
 * Get all certificates metadata for a manufacturer.
 * 
 * @param {string} walletAddress - Manufacturer wallet address.
 * @returns {Promise} Axios response (JSON with certificates array).
 */
export const listCertificates = async (walletAddress) => {
  return axios.get(`${CERTIFICATES_BASE}/${walletAddress}/all`);
};

