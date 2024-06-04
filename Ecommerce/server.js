const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const companies = ["AMZ", "TELP", "SNP", "MYN", "AZO"];
const categories = ["Phone", "Computer", "TV", "Earphone", "Tablet", "Charger", "Mouse", "Keypad", "Bluetooth", "Pendrive", "Remote", "Speaker", "Headset", "Laptop", "PC"];

// Replace 'your-token-here' with your actual token
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzE3NTEzMTMyLCJpYXQiOjE3MTc1MTI4MzIsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImM1ZTE4MzUyLTE5ZmQtNDE5ZC04ODliLTA2ZDlhNjg1OTgwYSIsInN1YiI6ImxvdmVsZWVuMjAyMS5iZTIxQGNoaXRrYXJhLmVkdS5pbiJ9LCJjb21wYW55TmFtZSI6ImdvTWFydCIsImNsaWVudElEIjoiYzVlMTgzNTItMTlmZC00MTlkLTg4OWItMDZkOWE2ODU5ODBhIiwiY2xpZW50U2VjcmV0IjoiYml3U1B0cUt1U2xXWmdVdyIsIm93bmVyTmFtZSI6IkxvdmVsZWVuIiwib3duZXJFbWFpbCI6ImxvdmVsZWVuMjAyMS5iZTIxQGNoaXRrYXJhLmVkdS5pbiIsInJvbGxObyI6IjEifQ.hESyytEylmDgUiH_LpkCUZkzKqNcLbu2KCUjc8FI03Y';
// Helper function to fetch products from the e-commerce server
async function fetchProducts(company, category, top, minPrice, maxPrice) {
    const url = `http://20.244.56.144/test/companies/${company}/categories/${category}/products`;
    try {
        const response = await axios.get(url, {
            params: {
                top,
                minPrice,
                maxPrice
            },
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            timeout: 500
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching products for ${company}:`, error.message);
        return [];
    }
}

// Generate a unique identifier for each product
function generateUniqueId(product, company) {
    return `${company}-${product.productName.replace(/\s+/g, '-')}-${product.price}-${product.rating}`;
}

// Route to get top n products within a category
app.get('/categories/:category/products', async (req, res) => {
    const { category } = req.params;
    const { n = 10, minPrice = 0, maxPrice = Infinity, page = 1, sort = '', order = 'asc' } = req.query;
    const top = Math.min(n, 10);

    if (!categories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    console.log(`Fetching products for category: ${category}, with n: ${n}, minPrice: ${minPrice}, maxPrice: ${maxPrice}`);

    let allProducts = [];
    for (const company of companies) {
        const products = await fetchProducts(company, category, 100, minPrice, maxPrice); // Fetching top 100 for better sorting
        products.forEach(product => product.id = generateUniqueId(product, company));
        allProducts = allProducts.concat(products);
    }

    if (sort) {
        allProducts.sort((a, b) => {
            if (order === 'asc') {
                return a[sort] > b[sort] ? 1 : -1;
            } else {
                return a[sort] < b[sort] ? 1 : -1;
            }
        });
    }

    const startIndex = (page - 1) * top;
    const endIndex = startIndex + top;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);

    res.json(paginatedProducts);
});

// Route to get product details by ID
app.get('/categories/:category/products/:productId', async (req, res) => {
    const { category, productId } = req.params;

    console.log(`Fetching product details for productId: ${productId} in category: ${category}`);

    for (const company of companies) {
        const products = await fetchProducts(company, category, 1000, 0, Infinity); // Fetching a large number to ensure the product is found
        const product = products.find(p => generateUniqueId(p, company) === productId);
        if (product) {
            return res.json(product);
        }
    }

    res.status(404).json({ error: 'Product not found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
