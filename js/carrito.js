let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const btnCarrito = document.getElementById("btnCarrito");
const carritoLateral = document.getElementById("carritoLateral");
const listaCarrito = document.getElementById("listaCarrito");
const contadorCarrito = document.getElementById("contadorCarrito");
const totalCarrito = document.getElementById("totalCarrito");
const btnComprar = document.getElementById("btnComprar");

const BACK_BASE_URL = "http://localhost:4000";

function getAuthToken() {
    return localStorage.getItem("auth_token");
}

if (btnCarrito) {
    btnCarrito.addEventListener("click", () => {
        if (!carritoLateral) return;
        carritoLateral.classList.toggle("activo");
    });

    // Cerrar carrito al hacer clic fuera del contenedor
    document.addEventListener("click", (event) => {
        if (!carritoLateral) return;
        if (!carritoLateral.classList.contains("activo")) return;

        const clickDentroCarrito = carritoLateral.contains(event.target);
        const clickEnBotonCarrito = btnCarrito.contains(event.target);

        if (!clickDentroCarrito && !clickEnBotonCarrito) {
            carritoLateral.classList.remove("activo");
        }
    });
}

function guardarCarrito() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

function actualizarCarrito() {

    carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    if (!listaCarrito) return;
    listaCarrito.innerHTML = "";
    let total = 0;
    let cantidadTotal = 0;

    carrito.forEach((producto, index) => {

        const imagenProducto = producto.imagen;

        total += producto.precio * producto.cantidad;
        cantidadTotal += producto.cantidad;

        listaCarrito.innerHTML += `
            <div class="item-carrito">
                <img src="${imagenProducto}" class="img-carrito">

                <div class="info-carrito">
                    <p>${producto.nombre}</p>

                    <div class="controles">
                        <button onclick="cambiarCantidad(${index}, -1)" class="btn-circle">-</button>
                        <span>${producto.cantidad}</span>
                        <button onclick="cambiarCantidad(${index}, 1)" class="btn-circle">+</button>
                        <button onclick="eliminarProducto(${index})" class="btn-delete">🗑</button>
                    </div>
                </div>
            </div>
        `;
    });

    if (contadorCarrito) contadorCarrito.textContent = cantidadTotal;
    if (totalCarrito) totalCarrito.textContent = total;
}

function agregarAlCarrito(id, nombre, precio, imagen) {

    carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    const productoExistente = carrito.find(p => p.id === id); 

    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({
            id: id,
            nombre: nombre,
            precio: precio,
            imagen: imagen,
            cantidad: 1
        });
    }

    guardarCarrito();
    actualizarCarrito();
}

function cambiarCantidad(index, cambio) {

    carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    carrito[index].cantidad += cambio;

    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }

    guardarCarrito();
    actualizarCarrito();
}

function eliminarProducto(index) {

    carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    carrito.splice(index, 1);

    guardarCarrito();
    actualizarCarrito();
}

async function realizarCompra() {
    carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    if (carrito.length === 0) {
        alert("Tu carrito está vacío");
        return;
    }

    const token = getAuthToken();
    if (!token) {
        alert("Inicia sesión para continuar con la compra");
        window.location.href = "cuenta.html";
        return;
    }

    try {
        const res = await fetch(`${BACK_BASE_URL}/api/checkout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ items: carrito })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data?.error || "No se pudo iniciar el pago");
            return;
        }

        if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
            return;
        }

        // Fallback: compra registrada sin pasarela
        localStorage.removeItem("carrito");
        actualizarCarrito();
        alert("Compra registrada. Revisa tu cuenta para ver el historial.");
        window.location.href = "cuenta.html";
    } catch (e) {
        alert("Error de conexión con el backend (¿Back está corriendo?)");
    }
}

if (btnComprar) {
    btnComprar.addEventListener("click", realizarCompra);
}

actualizarCarrito();

