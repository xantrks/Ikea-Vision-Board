/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Product } from '../types';
import ObjectCard from './ObjectCard';

interface ProductSidebarProps {
    products: Product[];
    selectedProduct: Product | null;
    onSelectProduct: (product: Product) => void;
    onDragStart: (e: React.DragEvent, product: Product) => void;
    onTouchStart: (e: React.TouchEvent, product: Product) => void;
    onAddOwnProductClick: () => void;
}

const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const ProductSidebar: React.FC<ProductSidebarProps> = ({ products, selectedProduct, onSelectProduct, onDragStart, onTouchStart, onAddOwnProductClick }) => {
  return (
    <aside className="w-full md:w-72 lg:w-80 bg-zinc-50 border-r border-zinc-200 p-4 flex flex-col h-full flex-shrink-0">
      <h2 className="text-xl font-bold text-zinc-800 mb-4 border-b pb-3">IKEA Products</h2>
      <div className="overflow-y-auto flex-grow scrollbar-hide -mr-4 pr-4">
        <div className="grid grid-cols-2 gap-4">
          {products.map(product => (
            <div 
                key={product.id}
                draggable="true" 
                onDragStart={(e) => onDragStart(e, product)}
                onTouchStart={(e) => onTouchStart(e, product)}
                className="cursor-move"
            >
              <ObjectCard 
                product={product} 
                isSelected={selectedProduct?.id === product.id}
                onClick={() => onSelectProduct(product)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-zinc-200">
        <button
            onClick={onAddOwnProductClick}
            className="w-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
            aria-label="Add your own product"
        >
            <PlusIcon />
            <span>Add Your Own</span>
        </button>
      </div>
    </aside>
  );
};

export default ProductSidebar;