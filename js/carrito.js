let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const btnCarrito = document.getElementById("btnCarrito");
const carritoLateral = document.getElementById("carritoLateral");
const listaCarrito = document.getElementById("listaCarrito");
const contadorCarrito = document.getElementById("contadorCarrito");
const totalCarrito = document.getElementById("totalCarrito");

if (btnCarrito) {
    btnCarrito.addEventListener("click", () => {
        carritoLateral.classList.toggle("activo");
    });
}

function guardarCarrito() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

function actualizarCarrito() {

    carrito = JSON.parse(localStorage.getItem("carrito")) || [];

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

actualizarCarrito();