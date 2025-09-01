/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateCompositeImage } from './services/geminiService';
import { Product } from './types';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import TouchGhost from './components/TouchGhost';
import ProductSidebar from './components/ProductSidebar';
import ResultModal from './components/ResultModal';
import AddProductModal from './components/AddProductModal';


// Pre-load a transparent image to use for hiding the default drag ghost.
const transparentDragImage = new Image();
transparentDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const loadingMessages = [
    "Surveying your room...",
    "Finding the perfect spot...",
    "Unpacking your new furniture...",
    "Adjusting for lighting and perspective...",
    "Generating photorealistic options...",
    "Assembling the final scene..."
];

const initialProducts: Product[] = [
    { id: 1, name: 'Poäng Chair', imageUrl: '/assets/ikea/poang-chair.png' },
    { id: 2, name: 'Lack Table', imageUrl: '/assets/ikea/lack-table.png' },
    { id: 3, name: 'Kallax Shelf', imageUrl: '/assets/ikea/kallax-shelf.png' },
    { id: 4, name: 'Strandmon Chair', imageUrl: '/assets/ikea/strandmon-chair.png' },
    { id: 5, name: 'Billy Bookcase', imageUrl: '/assets/ikea/billy-bookcase.png' },
    { id: 6, name: 'Malm Dresser', imageUrl: '/assets/ikea/malm-dresser.png' },
];


const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [persistedOrbPosition, setPersistedOrbPosition] = useState<{x: number, y: number} | null>(null);
  
  // State for result modal
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  // State for adding a new product
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // State for touch drag & drop
  const [isTouchDragging, setIsTouchDragging] = useState<boolean>(false);
  const [touchGhostPosition, setTouchGhostPosition] = useState<{x: number, y: number} | null>(null);
  const [isHoveringDropZone, setIsHoveringDropZone] = useState<boolean>(false);
  const [touchOrbPosition, setTouchOrbPosition] = useState<{x: number, y: number} | null>(null);
  const sceneImgRef = useRef<HTMLImageElement>(null);
  
  const roomImageUrl = roomImage ? URL.createObjectURL(roomImage) : null;
  const productImageUrl = selectedProduct ? selectedProduct.imageUrl : null;

  const handleProductDrop = useCallback(async (position: {x: number, y: number}, relativePosition: { xPercent: number; yPercent: number; }) => {
    if (!selectedProduct || !roomImage) {
      setError('Please select a product and upload a room image first.');
      return;
    }
    
    setPersistedOrbPosition(position);
    setIsLoading(true);
    setError(null);
    
    try {
      // If the product is user-uploaded, use its stored File object.
      // Otherwise, fetch the image from its URL.
      const productFile = selectedProduct.file ?? await (async () => {
        const response = await fetch(selectedProduct.imageUrl);
        const blob = await response.blob();
        return new File([blob], `${selectedProduct.name}.png`, { type: blob.type });
      })();

      const { finalImageUrl } = await generateCompositeImage(
        productFile, 
        selectedProduct.name,
        roomImage,
        "user's room",
        relativePosition
      );

      setResultImageUrl(finalImageUrl);
      setIsResultModalOpen(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the image. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setPersistedOrbPosition(null);
    }
  }, [selectedProduct, roomImage]);

  const handleDownload = useCallback(() => {
    if (resultImageUrl) {
        const link = document.createElement('a');
        link.href = resultImageUrl;
        link.download = `ikea-room-planner-${Date.now()}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }, [resultImageUrl]);

  const handleCloseResultModal = useCallback(() => {
    if (resultImageUrl) {
      const newRoomFile = dataURLtoFile(resultImageUrl, `generated-scene-${Date.now()}.jpeg`);
      setRoomImage(newRoomFile);
    }
    setIsResultModalOpen(false);
    setResultImageUrl(null);
  }, [resultImageUrl]);

  const handleReset = useCallback(() => {
    setSelectedProduct(null);
    setRoomImage(null);
    setError(null);
    setIsLoading(false);
    setPersistedOrbPosition(null);
  }, []);

  const handleAddOwnProductClick = () => {
    setIsAddProductModalOpen(true);
  };
  
  const handleCloseAddProductModal = () => {
    setIsAddProductModalOpen(false);
  };
  
  const handleCustomProductUpload = (file: File) => {
    const newProduct: Product = {
      id: Date.now(),
      name: file.name.replace(/\.[^/.]+$/, ""), // Use filename (without extension) as name
      imageUrl: URL.createObjectURL(file), // Create a temporary URL for the image
      file: file, // Store the file object itself
    };
    setProducts(prevProducts => [newProduct, ...prevProducts]);
    setSelectedProduct(newProduct); // Auto-select the newly added product
    setIsAddProductModalOpen(false);
  };
  
  // Effect for cleaning up object URLs from user-uploaded images
  useEffect(() => {
    return () => {
        if (roomImageUrl) URL.revokeObjectURL(roomImageUrl);
        products.forEach(product => {
            if (product.file && product.imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(product.imageUrl);
            }
        });
    };
  }, [roomImageUrl, products]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
        setLoadingMessageIndex(0); // Reset on start
        interval = setInterval(() => {
            setLoadingMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
        }, 3000);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const handleDragStart = (e: React.DragEvent, product: Product) => {
    setSelectedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
  };

  const handleTouchStart = (e: React.TouchEvent, product: Product) => {
    setSelectedProduct(product);
    e.preventDefault();
    setIsTouchDragging(true);
    const touch = e.touches[0];
    setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchDragging) return;
      const touch = e.touches[0];
      setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });
      
      const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementUnderTouch?.closest<HTMLDivElement>('[data-dropzone-id="room-uploader"]');

      if (dropZone) {
          const rect = dropZone.getBoundingClientRect();
          setTouchOrbPosition({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
          setIsHoveringDropZone(true);
      } else {
          setIsHoveringDropZone(false);
          setTouchOrbPosition(null);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTouchDragging) return;
      
      const touch = e.changedTouches[0];
      const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementUnderTouch?.closest<HTMLDivElement>('[data-dropzone-id="room-uploader"]');

      if (dropZone && sceneImgRef.current) {
          const img = sceneImgRef.current;
          const containerRect = dropZone.getBoundingClientRect();
          const { naturalWidth, naturalHeight } = img;
          const { width: containerWidth, height: containerHeight } = containerRect;

          const imageAspectRatio = naturalWidth / naturalHeight;
          const containerAspectRatio = containerWidth / containerHeight;

          let renderedWidth, renderedHeight;
          if (imageAspectRatio > containerAspectRatio) {
              renderedWidth = containerWidth;
              renderedHeight = containerWidth / imageAspectRatio;
          } else {
              renderedHeight = containerHeight;
              renderedWidth = containerHeight * imageAspectRatio;
          }
          
          const offsetX = (containerWidth - renderedWidth) / 2;
          const offsetY = (containerHeight - renderedHeight) / 2;

          const dropX = touch.clientX - containerRect.left;
          const dropY = touch.clientY - containerRect.top;

          const imageX = dropX - offsetX;
          const imageY = dropY - offsetY;
          
          if (!(imageX < 0 || imageX > renderedWidth || imageY < 0 || imageY > renderedHeight)) {
            const xPercent = (imageX / renderedWidth) * 100;
            const yPercent = (imageY / renderedHeight) * 100;
            
            handleProductDrop({ x: dropX, y: dropY }, { xPercent, yPercent });
          }
      }

      setIsTouchDragging(false);
      setTouchGhostPosition(null);
      setIsHoveringDropZone(false);
      setTouchOrbPosition(null);
    };

    if (isTouchDragging) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouchDragging, handleProductDrop]);
  
  return (
    <div className="flex flex-col h-screen bg-white text-zinc-800">
      <TouchGhost 
        imageUrl={isTouchDragging ? productImageUrl : null} 
        position={touchGhostPosition}
      />
      <Header />
      <div className="flex flex-grow overflow-hidden">
        <ProductSidebar 
            products={products}
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
            onDragStart={handleDragStart}
            onTouchStart={handleTouchStart}
            onAddOwnProductClick={handleAddOwnProductClick}
        />
        <main className="flex-grow p-4 md:p-8 flex flex-col items-center justify-center bg-zinc-100">
            {error ? (
                <div className="text-center animate-fade-in bg-red-50 border border-red-200 p-8 rounded-lg max-w-2xl mx-auto">
                    <h2 className="text-3xl font-extrabold mb-4 text-red-800">An Error Occurred</h2>
                    <p className="text-lg text-red-700 mb-6">{error}</p>
                    <button
                        onClick={handleReset}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                    <ImageUploader 
                        ref={sceneImgRef}
                        id="room-uploader" 
                        onFileSelect={setRoomImage} 
                        imageUrl={roomImageUrl}
                        isDropZone={!!roomImage && !!selectedProduct && !isLoading}
                        onProductDrop={handleProductDrop}
                        persistedOrbPosition={persistedOrbPosition}
                        isTouchHovering={isHoveringDropZone}
                        touchOrbPosition={touchOrbPosition}
                    />
                    <div className="text-center mt-6 min-h-[4rem] flex flex-col justify-center items-center">
                    {isLoading ? (
                        <div className="animate-fade-in">
                            <Spinner />
                            <p className="text-xl mt-4 text-zinc-600 transition-opacity duration-500">{loadingMessages[loadingMessageIndex]}</p>
                        </div>
                    ) : !roomImage ? (
                        <p className="text-zinc-500 animate-fade-in text-lg">
                            Upload a photo of your room to get started.
                        </p>
                    ) : !selectedProduct ? (
                        <p className="text-zinc-500 animate-fade-in text-lg">
                            Select a product from the sidebar to place in your room.
                        </p>
                    ) : (
                        <p className="text-zinc-500 animate-fade-in text-lg">
                            Drag your selected IKEA product into your room.
                        </p>
                    )}
                    </div>
                </div>
            )}
        </main>
      </div>
      <ResultModal 
        isOpen={isResultModalOpen} 
        onClose={handleCloseResultModal}
        imageUrl={resultImageUrl}
        onDownload={handleDownload}
      />
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={handleCloseAddProductModal}
        onFileSelect={handleCustomProductUpload}
      />
    </div>
  );
};

export default App;