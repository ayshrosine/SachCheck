import boto3
import uuid
import os
from app.config import settings
from typing import Optional


class R2Storage:
    def __init__(self):
        self.client = None
        self.bucket = settings.r2_bucket
        self.enabled = False
        
        # Only initialize R2 client if credentials are provided
        if settings.r2_account_id and settings.r2_access_key and settings.r2_secret_key:
            try:
                self.client = boto3.client(
                    "s3",
                    endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
                    aws_access_key_id=settings.r2_access_key,
                    aws_secret_access_key=settings.r2_secret_key
                )
                self.enabled = True
                print("R2 storage initialized successfully")
            except Exception as e:
                print(f"R2 storage initialization failed: {e}")
                print("Running in storage-less mode")
        else:
            print("No R2 credentials configured - running in storage-less mode")
    
    def upload_file(self, local_path: str, modality: str) -> str:
        """Upload a file to R2 and return the object key"""
        if not self.enabled or not self.client:
            # Return a mock key when storage is not available
            key = f"{modality}/{uuid.uuid4()}"
            print(f"Storage not available - using mock key: {key}")
            return key
            
        key = f"{modality}/{uuid.uuid4()}"
        self.client.upload_file(local_path, self.bucket, key)
        return key
    
    def delete_file(self, key: str) -> bool:
        """Delete a file from R2"""
        if not self.enabled or not self.client:
            return False
            
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except Exception as e:
            print(f"Error deleting file {key}: {e}")
            return False
    
    def get_file_url(self, key: str, expires_in: int = 3600) -> str:
        """Generate a presigned URL for a file"""
        if not self.enabled or not self.client:
            return ""
            
        return self.client.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket, 'Key': key},
            ExpiresIn=expires_in
        )
    
    def schedule_deletion(self, key: str, hours: int = 48):
        """
        Schedule a file for deletion.
        Note: The actual deletion should be handled by:
        1. R2 lifecycle rules (set in Cloudflare dashboard)
        2. A scheduled cron job that deletes old objects
        This method is a placeholder for any additional logic needed.
        """
        # The primary deletion mechanism should be R2 lifecycle rules
        # Set a rule in Cloudflare dashboard to expire objects after 48 hours
        pass


# Global storage instance
storage = R2Storage()