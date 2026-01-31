import { apiClient, ApiResponse, PaginatedResponse } from './client';
import { 
  Asset, 
  CreateAssetRequest, 
  UpdateAssetRequest,
  AssetType,
  RiskLevel 
} from './types';

export class AssetsService {
  // Get all assets
  async getAssets(params?: {
    page?: number;
    limit?: number;
    type?: AssetType;
    criticality?: RiskLevel;
    search?: string;
  }): Promise<ApiResponse<Asset[]>> {
    return apiClient.get('/api/assets', params);
  }

  // Get asset by ID
  async getAsset(id: string): Promise<ApiResponse<Asset>> {
    return apiClient.get(`/api/assets/${id}`);
  }

  // Create new asset
  async createAsset(assetData: CreateAssetRequest): Promise<ApiResponse<Asset>> {
    return apiClient.post('/api/assets', assetData);
  }

  // Update asset
  async updateAsset(id: string, assetData: UpdateAssetRequest): Promise<ApiResponse<Asset>> {
    return apiClient.put(`/api/assets/${id}`, assetData);
  }

  // Delete asset
  async deleteAsset(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/assets/${id}`);
  }

  // Get assets with risks
  async getAssetsWithRisks(): Promise<ApiResponse<Asset[]>> {
    return apiClient.get('/api/assets/with-risks');
  }

  // Get critical assets
  async getCriticalAssets(): Promise<ApiResponse<Asset[]>> {
    return apiClient.get('/api/assets/critical');
  }

  // Get assets by type distribution
  async getAssetTypeDistribution(): Promise<ApiResponse<{
    type: AssetType;
    count: number;
    percentage: number;
  }[]>> {
    return apiClient.get('/api/assets/distribution');
  }

  // Export assets data
  async exportAssets(format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await fetch(`${apiClient.baseURL}/api/assets/export?format=${format}`, {
      headers: apiClient.token ? {
        Authorization: `Bearer ${apiClient.token}`,
      } : {},
    });
    
    if (!response.ok) {
      throw new Error('Failed to export assets');
    }
    
    return response.blob();
  }

  // Upload asset file (for bulk import)
  async uploadAssetFile(file: File): Promise<ApiResponse<{
    imported: number;
    failed: number;
    errors?: any[];
  }>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiClient.baseURL}/api/assets/import`, {
      method: 'POST',
      body: formData,
      headers: apiClient.token ? {
        Authorization: `Bearer ${apiClient.token}`,
      } : {},
    });

    if (!response.ok) {
      throw new Error('Failed to upload asset file');
    }

    return response.json();
  }
}

export const assetsService = new AssetsService();