import { Request, Response } from 'express';
import { createNewAsset, findAssetById, updateExistingAsset } from '../helpers/assetQueries';
import { findCustomerById } from '../helpers/customerQueries';
import { deleteFileFromS3 } from '../config/s3';

export const createAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      machineName,
      machineType,
      modelName,
      serialNumber,
      installationDate,
      notes,
      status,
      imageUrl,
      secondaryImageUrl,
    } = req.body;

    if (!machineName || !machineType || !modelName || !installationDate) {
      res.status(400).json({ message: 'machineName, machineType, modelName, and installationDate are required' });
      return;
    }

    if (customerId) {
      const customer = await findCustomerById(customerId);
      if (!customer) {
        res.status(404).json({ message: 'Customer not found' });
        return;
      }
    }

    const newAsset = await createNewAsset({
      customerId: customerId || null,
      machineName,
      machineType,
      modelName,
      serialNumber: serialNumber || null,
      installationDate,
      notes: notes || null,
      status: status !== undefined ? Boolean(status) : true,
      imageUrl: imageUrl || null,
      secondaryImageUrl: secondaryImageUrl || null,
    });

    res.status(201).json({
      success: true,
      message: 'Asset registered successfully',
      data: newAsset,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to create asset',
      error: error?.message,
    });
  }
};

export const getAssetById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const asset = await findAssetById(id);

    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    res.status(200).json({ success: true, data: asset });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch asset details', error: error?.message, });
  }
};

export const updateAsset = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await findAssetById(id);

    if (!existing) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    const updated = await updateExistingAsset(id, req.body);

    res.status(200).json({success: true,message: 'Asset updated successfully',data: updated,});
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update asset', error: error?.message });
  }
};

export const deleteAsset = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const asset = await findAssetById(id);

    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    if (asset.imageUrl) {
      await deleteFileFromS3(asset.imageUrl);
    }
    if (asset.secondaryImageUrl) {
      await deleteFileFromS3(asset.secondaryImageUrl);
    }

    await asset.destroy();

    res.status(200).json({ success: true, message: 'Asset and associated images deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete asset', error: error?.message });
  }
};
