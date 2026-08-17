import { Asset, type AssetAttributes } from '../models/asset';

export const createNewAsset = async (data: AssetAttributes) => {
  return await Asset.create(data);
};

export const findAssetById = async (id: string) => {
  return await Asset.findByPk(id);
};

export const updateExistingAsset = async (id: string, data: Partial<AssetAttributes>) => {
  const asset = await Asset.findByPk(id);
  if (!asset) return null;
  return await asset.update(data);
};

export const deleteExistingAsset = async (id: string) => {
  const asset = await Asset.findByPk(id);
  if (!asset) return false;
  await asset.destroy();
  return true;
};
