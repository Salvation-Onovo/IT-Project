
// =====================================
// 1. SAMPLE INVENTORY DATA
// =====================================

const sampleProducts = [
    {
        id: "P001",
        name: "Rice",
        category: "Grains",
        quantity: 50,
        minimumStock: 20,
        costPrice: 45000,
        sellingPrice: 50000
    },
    {
        id: "P002",
        name: "Beans",
        category: "Grains",
        quantity: 8,
        minimumStock: 15,
        costPrice: 30000,
        sellingPrice: 35000
    },
    {
        id: "P003",
        name: "Vegetable Oil",
        category: "Groceries",
        quantity: 3,
        minimumStock: 10,
        costPrice: 8000,
        sellingPrice: 9500
    },
    {
        id: "P004",
        name: "Garri",
        category: "Food",
        quantity: 40,
        minimumStock: 10,
        costPrice: 12000,
        sellingPrice: 15000
    }
];



//LOAD SAVED PRODUCTS- gets the products from local storage and returns them. If there are no products in local storage, it returns a copy of the sample products. If the data in local storage is invalid, it logs an error and returns a copy of the sample products.
function loadProducts() {
    try {
        const savedProducts = localStorage.getItem("inventoryProducts");

        if (savedProducts === null) {
            return sampleProducts.map(product => ({ ...product }));
        }

        const parsedProducts = JSON.parse(savedProducts);

        if (
            !Array.isArray(parsedProducts) ||
            !parsedProducts.every(product =>
                product &&
                typeof product.id === "string" &&
                typeof product.name === "string" &&
                typeof product.category === "string" &&
                Number.isSafeInteger(product.quantity) &&
                product.quantity >= 0 &&
                Number.isSafeInteger(product.minimumStock) &&
                product.minimumStock >= 0 &&
                Number.isFinite(product.costPrice) &&
                product.costPrice >= 0 &&
                Number.isFinite(product.sellingPrice) &&
                product.sellingPrice >= 0
            )
        ) {
            throw new Error("Invalid inventory data.");
        }

        return parsedProducts;

    } catch (error) {
        console.error("Could not load inventory:", error);
        return sampleProducts.map(product => ({ ...product }));
    }
}

let products = loadProducts();


//SAVE PRODUCTS - saves the current products array to local storage. If the save operation fails, it logs an error and alerts the user.
function saveProducts() {
    try {
        localStorage.setItem(
            "inventoryProducts",
            JSON.stringify(products)
        );

        return true;

    } catch (error) {
        console.error("Could not save inventory:", error);

        alert(
            "Your changes could not be saved. " +
            "Check browser storage and try again."
        );

        return false;
    }
}


//SELECT HTML ELEMENTS - gets references to the relevant HTML elements

const productTableBody =
    document.getElementById("product-table-body");

const productModal =
    document.getElementById("product-modal");

const productForm =
    document.getElementById("product-form");

const searchInput =
    document.getElementById("search-product");

const emptyMessage =
    document.getElementById("empty-message");



//FORMAT MONEY - formats a given amount as Nigerian Naira currency using the Intl.NumberFormat API. It returns the formatted currency string with a maximum of two decimal places.
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2
    }).format(amount);
}


//DETERMINE STOCK STATUS - returns an object containing the stock status text and corresponding CSS class name based on the product's quantity and minimum stock level.
function getStockStatus(product) {
    if (product.quantity === 0) {
        return {
            text: "Out of Stock",
            className: "status-out-stock"
        };
    }

    if (product.quantity <= product.minimumStock) {
        return {
            text: "Low Stock",
            className: "status-low-stock"
        };
    }

    return {
        text: "In Stock",
        className: "status-in-stock"
    };
}



//DISPLAY PRODUCTS - renders the product list in the HTML table based on the current products array and an optional search term. It filters the products based on the search term and updates the table body accordingly. If no products match the search, it displays an empty message.
function renderProducts(searchTerm = "") {
    const query = searchTerm.trim().toLowerCase();

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query)
    );

    productTableBody.replaceChildren();

    emptyMessage.classList.toggle(
        "hidden",
        filteredProducts.length > 0
    );

    filteredProducts.forEach(product => {
        const row = document.createElement("tr");

        const status = getStockStatus(product);

        const productCell = document.createElement("td");

        const nameElement = document.createElement("span");
        nameElement.className = "product-name";
        nameElement.textContent = product.name;

        const codeElement = document.createElement("small");
        codeElement.className = "product-code";
        codeElement.textContent = product.id;

        productCell.append(nameElement, codeElement);

        row.appendChild(productCell);

        row.appendChild(
            createTextCell(product.category)
        );

        row.appendChild(
            createTextCell(product.quantity)
        );

        row.appendChild(
            createTextCell(formatCurrency(product.costPrice))
        );

        row.appendChild(
            createTextCell(formatCurrency(product.sellingPrice))
        );

        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");
        statusBadge.className = `status ${status.className}`;
        statusBadge.textContent = status.text;

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");

        const actionButtons = document.createElement("div");
        actionButtons.className = "action-buttons";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-btn";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            editProduct(product.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            deleteProduct(product.id);
        });

        actionButtons.append(editButton, deleteButton);
        actionCell.appendChild(actionButtons);
        row.appendChild(actionCell);

        productTableBody.appendChild(row);
    });
}


function createTextCell(value) {
    const cell = document.createElement("td");
    cell.textContent = String(value);
    return cell;
}


//UPDATE DASHBOARD STATISTICS - calculates and updates the dashboard statistics based on the current products array. It computes the total number of products, total stock quantity, number of low-stock products, and total inventory value. It also updates the corresponding HTML elements with the calculated values and renders low-stock alerts.
function updateDashboard() {
    const totalProducts = products.length;

    const totalStock = products.reduce(
        (total, product) => total + product.quantity,
        0
    );

    const lowStockProducts = products.filter(
        product => product.quantity <= product.minimumStock
    );

    const inventoryValue = products.reduce(
        (total, product) =>
            total + product.quantity * product.costPrice,
        0
    );

    document.getElementById("total-products").textContent =
        totalProducts;

    document.getElementById("total-stock").textContent =
        totalStock.toLocaleString("en-NG");

    document.getElementById("low-stock").textContent =
        lowStockProducts.length;

    document.getElementById("inventory-value").textContent =
        formatCurrency(inventoryValue);

    renderLowStockAlerts(lowStockProducts);
}



//DISPLAY LOW-STOCK ALERTS - renders a list of low-stock products in the low-stock alert section of the dashboard. If there are no low-stock products, it displays a message indicating that all products are above their minimum stock levels.
function renderLowStockAlerts(lowStockProducts) {
    const alertContainer =
        document.getElementById("low-stock-list");

    alertContainer.replaceChildren();

    if (lowStockProducts.length === 0) {
        const message = document.createElement("p");

        message.textContent =
            "All products are above their minimum stock levels.";

        alertContainer.appendChild(message);
        return;
    }

    lowStockProducts.forEach(product => {
        const item = document.createElement("div");

        item.className = "low-stock-item";

        const details = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = product.name;

        const description = document.createElement("p");

        description.textContent =
            `Minimum stock: ${product.minimumStock}`;

        details.append(name, description);

        const quantity = document.createElement("span");

        quantity.className = "low-stock-quantity";

        quantity.textContent =
            `${product.quantity} remaining`;

        item.append(details, quantity);

        alertContainer.appendChild(item);
    });
}



//OPEN AND CLOSE THE PRODUCT MODAL - functions to open and close the product modal. The openModal function removes the "hidden" class from the modal and sets focus to the product name input field. The closeModal function adds the "hidden" class back to the modal, resets the form, clears the product ID input, and resets the modal title to "Add New Product".
function openModal() {
    productModal.classList.remove("hidden");

    document.getElementById("product-name").focus();
}


function closeModal() {
    productModal.classList.add("hidden");
    productForm.reset();

    document.getElementById("product-id").value = "";

    document.getElementById("modal-title").textContent =
        "Add New Product";
}


document.getElementById("add-product-btn")
    .addEventListener("click", () => {
        closeModal();
        openModal();
    });


document.getElementById("close-modal")
    .addEventListener("click", closeModal);


document.getElementById("cancel-modal")
    .addEventListener("click", closeModal);



//VALIDATE PRODUCT FORM - retrieves and validates the product form data. It checks for required fields, ensures that quantity and minimum stock are non-negative whole numbers, and verifies that cost price and selling price are valid non-negative numbers. If any validation fails, it throws an error with an appropriate message. If all validations pass, it returns an object containing the validated product data.
function getProductFormData() {
    const name =
        document.getElementById("product-name").value.trim();

    const category =
        document.getElementById("product-category").value.trim();

    const quantity =
        Number(document.getElementById("product-quantity").value);

    const minimumStock =
        Number(document.getElementById("minimum-stock").value);

    const costPrice =
        Number(document.getElementById("cost-price").value);

    const sellingPrice =
        Number(document.getElementById("selling-price").value);

    if (!name || !category) {
        throw new Error("Product name and category are required.");
    }

    if (
        !Number.isSafeInteger(quantity) ||
        quantity < 0
    ) {
        throw new Error("Quantity must be a non-negative whole number.");
    }

    if (
        !Number.isSafeInteger(minimumStock) ||
        minimumStock < 0
    ) {
        throw new Error(
            "Minimum stock must be a non-negative whole number."
        );
    }

    if (
        !Number.isFinite(costPrice) ||
        costPrice < 0 ||
        !Number.isFinite(sellingPrice) ||
        sellingPrice < 0
    ) {
        throw new Error("Prices must be valid non-negative numbers.");
    }

    return {
        name,
        category,
        quantity,
        minimumStock,
        costPrice,
        sellingPrice
    };
}



//ADD OR UPDATE PRODUCTS - handles the submission of the product form. It prevents the default form submission behavior, retrieves and validates the form data, and either updates an existing product or adds a new product to the products array. It saves the updated products to local storage, re-renders the product list and dashboard statistics, closes the modal, and displays a success alert. If any errors occur during validation or saving, it alerts the user with an appropriate message.

productForm.addEventListener("submit", event => {
    event.preventDefault();

    try {
        const productData = getProductFormData();

        const existingId =
            document.getElementById("product-id").value;

        const previousProducts = products;

        if (existingId) {
            products = products.map(product =>
                product.id === existingId
                    ? {
                        ...product,
                        ...productData
                    }
                    : product
            );

        } else {
            const newProduct = {
                id: generateProductId(),
                ...productData
            };

            products = [...products, newProduct];
        }

        if (!saveProducts()) {
            products = previousProducts;
            return;
        }

        renderProducts(searchInput.value);
        updateDashboard();
        closeModal();

        alert(
            existingId
                ? "Product updated successfully."
                : "Product added successfully."
        );

    } catch (error) {
        alert(error.message);
    }
});


function generateProductId() {
    let id;

    do {
        id = `P${Date.now()}${Math.floor(Math.random() * 1000)}`;
    } while (products.some(product => product.id === id));

    return id;
}


//EDIT PRODUCTS - populates the product form with the data of the product to be edited. It finds the product by its ID, fills in the form fields with the product's details, updates the modal title to "Edit Product", and opens the modal. If the product is not found, it alerts the user.
function editProduct(productId) {
    const product = products.find(
        item => item.id === productId
    );

    if (!product) {
        alert("Product not found.");
        return;
    }

    document.getElementById("product-id").value =
        product.id;

    document.getElementById("product-name").value =
        product.name;

    document.getElementById("product-category").value =
        product.category;

    document.getElementById("product-quantity").value =
        product.quantity;

    document.getElementById("minimum-stock").value =
        product.minimumStock;

    document.getElementById("cost-price").value =
        product.costPrice;

    document.getElementById("selling-price").value =
        product.sellingPrice;

    document.getElementById("modal-title").textContent =
        "Edit Product";

    openModal();
}



//DELETE PRODUCTS - prompts the user for confirmation before deleting a product. It finds the product by its ID, asks the user to confirm the deletion, and if confirmed, removes the product from the products array. It saves the updated products to local storage, re-renders the product list and dashboard statistics, and alerts the user of successful deletion. If the product is not found or if saving fails, it alerts the user accordingly.
function deleteProduct(productId) {
    const product = products.find(
        item => item.id === productId
    );

    if (!product) {
        alert("Product not found.");
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete ${product.name}?`
    );

    if (!confirmed) {
        return;
    }

    const previousProducts = products;

    products = products.filter(
        item => item.id !== productId
    );

    if (!saveProducts()) {
        products = previousProducts;
        return;
    }

    renderProducts(searchInput.value);
    updateDashboard();

    alert("Product deleted successfully.");
}


//SEARCH PRODUCTS - adds an event listener to the search input field that listens for input events. When the user types in the search field, it calls the renderProducts function with the current value of the search input, effectively filtering and displaying the products that match the search term.
searchInput.addEventListener("input", event => {
    renderProducts(event.target.value);
});



//SIDEBAR NAVIGATION - adds click event listeners to all navigation links in the sidebar. When a link is clicked, it removes the "active" class from all links and adds it to the clicked link, visually indicating which section of the application is currently active.
const navigationLinks =
    document.querySelectorAll(".nav-link");

navigationLinks.forEach(link => {
    link.addEventListener("click", () => {
        navigationLinks.forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");
    });
});



//INITIALISE APPLICATION - calls the renderProducts and updateDashboard functions to display the initial product list and dashboard statistics when the application is first loaded.
renderProducts();
updateDashboard();
