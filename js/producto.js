document.addEventListener("DOMContentLoaded", () => {

    //  Base de datos simulada
    const productos = [
        { id: "1", nombre: "VueJS", precio: 25000, imagen: "img/1.jpg" },
        { id: "2", nombre: "AngularJS", precio: 25000, imagen: "img/2.jpg" },
        { id: "3", nombre: "ReactJS", precio: 25000, imagen: "img/3.jpg" },
        { id: "4", nombre: "Redux", precio: 25000, imagen: "img/4.jpg" },
        { id: "5", nombre: "NodeJS", precio: 25000, imagen: "img/5.jpg" },
        { id: "6", nombre: "SASS", precio: 25000, imagen: "img/6.jpg" },
        { id: "7", nombre: "HTML", precio: 25000, imagen: "img/7.jpg" },
        { id: "8", nombre: "Github", precio: 25000, imagen: "img/8.jpg" },
        { id: "9", nombre: "BulmaCSS", precio: 25000, imagen: "img/9.jpg" },
        { id: "10", nombre: "TypeScript", precio: 25000, imagen: "img/10.jpg" },
        { id: "11", nombre: "Drupal", precio: 25000, imagen: "img/11.jpg" },
        { id: "12", nombre: "JavaScript", precio: 25000, imagen: "img/12.jpg" },
        { id: "13", nombre: "GraphQL", precio: 25000, imagen: "img/13.jpg" },
        { id: "14", nombre: "WordPress", precio: 25000, imagen: "img/14.jpg" }
    ];

    // Obtener ID desde la URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    // Buscar producto
    const producto = productos.find(prod => prod.id === id);

    if (!producto) {
        window.location.href = "index.html";
        return;
    }

    // Renderizar producto en pantalla
    document.querySelector("h1").textContent = producto.nombre;
    document.querySelector(".camisa__imagen").src = producto.imagen;
    document.querySelector(".precio").textContent = `$${producto.precio}`;

    // Capturar formulario
    const formulario = document.querySelector(".formulario");

    formulario.addEventListener("submit", (e) => {
        e.preventDefault();

        const talla = formulario.querySelector("select").value;
        const cantidad = parseInt(formulario.querySelector("input[type='number']").value);

        // Validaciones
        if (talla === "-- Seleccionar talla --" || !talla) {
            alert("Debes seleccionar una talla");
            return;
        }

        if (!cantidad || cantidad <= 0) {
            alert("Debes ingresar una cantidad válida");
            return;
        }

        //Crear objeto producto para el carrito
        const productoCarrito = {
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            talla: talla,
            cantidad: cantidad
        };

        // Obtener carrito actual
        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

        //  Verificar si ya existe mismo producto con misma talla
        const existe = carrito.find(item => 
            item.id === productoCarrito.id && item.talla === productoCarrito.talla
        );

        if (existe) {
            existe.cantidad += cantidad;
        } else {
            carrito.push(productoCarrito);
        }

        // Guardar carrito actualizado
        localStorage.setItem("carrito", JSON.stringify(carrito));

        alert("Producto agregado al carrito ✅");

        formulario.reset();
    });


    function actualizarContador() {
        const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        
        const contador = document.getElementById("contadorCarrito");
        if (contador) {
            contador.textContent = totalItems;
        }
    }
    actualizarContador();

    document.getElementById("carritoBtn").addEventListener("click", () => {
        window.location.href = "";
    });
    const btnCarrito = document.getElementById("btnCarrito");
    const panelCarrito = document.getElementById("panelCarrito");
    const cerrarCarrito = document.getElementById("cerrarCarrito");

    btnCarrito.addEventListener("click", () => {
        panelCarrito.classList.add("activo");
    });

    cerrarCarrito.addEventListener("click", () => {
        panelCarrito.classList.remove("activo");
    });
});

