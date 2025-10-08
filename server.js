// server.js - Complete Express server for Week 2 assignment

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Custom Error Classes
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

// Custom Logger Middleware
const loggerMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
};

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // For demo purposes, valid API key is "secret-key-123"
  if (!apiKey) {
    return next(new AuthenticationError('API key is required in x-api-key header'));
  }
  
  if (apiKey !== 'secret-key-123') {
    return next(new AuthenticationError('Invalid API key'));
  }
  
  next();
};

// Validation Middleware for Product Creation/Update
const validateProductMiddleware = (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  }

  if (price === undefined || typeof price !== 'number' || price < 0) {
    errors.push('Price is required and must be a non-negative number');
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Category is required and must be a non-empty string');
  }

  if (typeof inStock !== 'boolean') {
    errors.push('inStock is required and must be a boolean');
  }

  if (errors.length > 0) {
    return next(new ValidationError(errors.join(', ')));
  }

  next();
};

// Global Error Handling Middleware
const errorHandlerMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      type: err.name || 'Error',
      statusCode
    }
  });
};

// Async Error Wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware setup
app.use(bodyParser.json());
app.use(loggerMiddleware);

// Sample in-memory products database - CORRECTED VERSION
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM', // Fixed: "1608 RAW" -> "16GB RAM"
    price: 1200,
    category: 'electronics',
    inStock: true // Fixed: "instock" -> "inStock"
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800, // Fixed: 880 -> 800 (from original)
    category: 'electronics',
    inStock: true // Fixed: "instock" -> "inStock"
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer', // Fixed: "Programable" -> "Programmable"
    price: 50, // Fixed: 80 -> 50 (from original)
    category: 'kitchen',
    inStock: false // Fixed: "instock" -> "inStock"
  }
];

// Root route - CORRECTED VERSION
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Product API!',
    endpoints: {
      getAllProducts: 'GET /api/products',
      getProduct: 'GET /api/products/:id',
      createProduct: 'POST /api/products',
      updateProduct: 'PUT /api/products/:id',
      deleteProduct: 'DELETE /api/products/:id',
      searchProducts: 'GET /api/products/search?q=query',
      getStats: 'GET /api/products/stats' // Fixed: "getState" -> "getStats", "/tints" -> "/stats"
    },
    note: 'For POST, PUT, and DELETE operations, include x-api-key: secret-key-123 in headers' // Fixed: "notet" -> "note"
  });
});

// GET /api/products - Get all products with filtering and pagination
app.get('/api/products', asyncHandler(async (req, res) => {
  let filteredProducts = [...products];
  
  // Filter by category
  if (req.query.category) {
    filteredProducts = filteredProducts.filter(
      product => product.category.toLowerCase() === req.query.category.toLowerCase()
    );
  }
  
  // Filter by inStock
  if (req.query.inStock) {
    const inStock = req.query.inStock.toLowerCase() === 'true';
    filteredProducts = filteredProducts.filter(product => product.inStock === inStock);
  }
  
  // Search in name and description
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase();
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  res.json({ // Fixed: Added opening curly brace
    products: paginatedProducts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(filteredProducts.length / limit),
      totalProducts: filteredProducts.length,
      hasNext: endIndex < filteredProducts.length,
      hasPrev: startIndex > 0
    }
  });
}));

// GET /api/products/:id - Get a specific product
app.get('/api/products/:id', asyncHandler(async (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    throw new NotFoundError(`Product with id ${req.params.id} not found`);
  }
  
  res.json(product);
}));

// POST /api/products - Create a new product
app.post('/api/products', 
  authMiddleware,
  validateProductMiddleware,
  asyncHandler(async (req, res) => {
    const { name, description, price, category, inStock } = req.body;
    
    const newProduct = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      price,
      category: category.trim(),
      inStock
    };
    
    products.push(newProduct);
    
    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct
    });
  })
);

// PUT /api/products/:id - Update a product
app.put('/api/products/:id',
  authMiddleware,
  validateProductMiddleware,
  asyncHandler(async (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
      throw new NotFoundError(`Product with id ${req.params.id} not found`);
    }
    
    const { name, description, price, category, inStock } = req.body;
    
    products[productIndex] = {
      ...products[productIndex],
      name: name.trim(),
      description: description.trim(),
      price,
      category: category.trim(),
      inStock
    };
    
    res.json({
      message: 'Product updated successfully',
      product: products[productIndex]
    });
  })
);

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
      throw new NotFoundError(`Product with id ${req.params.id} not found`);
    }
    
    const deletedProduct = products.splice(productIndex, 1)[0];
    
    res.json({
      message: 'Product deleted successfully',
      product: deletedProduct
    });
  })
);

// GET /api/products/search - Search products by name or description
app.get('/api/products/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    throw new ValidationError('Search query parameter "q" is required');
  }
  
  const searchTerm = q.toLowerCase();
  const searchResults = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm)
  );
  
  res.json({
    query: q,
    results: searchResults,
    count: searchResults.length
  });
}));

// GET /api/products/stats - Get product statistics
app.get('/api/products/stats', asyncHandler(async (req, res) => {
  const stats = {
    totalProducts: products.length,
    totalInStock: products.filter(p => p.inStock).length,
    totalOutOfStock: products.filter(p => !p.inStock).length,
    categories: {},
    priceStats: {
      highest: products.length > 0 ? Math.max(...products.map(p => p.price)) : 0,
      lowest: products.length > 0 ? Math.min(...products.map(p => p.price)) : 0,
      average: products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : 0
    }
  };
  
  // Count by category
  products.forEach(product => {
    if (!stats.categories[product.category]) {
      stats.categories[product.category] = 0;
    }
    stats.categories[product.category]++;
  });
  
  res.json(stats);
}));

// 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      type: 'NotFoundError',
      statusCode: 404
    }
  });
});

// Apply error handling middleware (must be last)
app.use(errorHandlerMiddleware);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app;