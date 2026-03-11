const BACK_BASE_URL = "http://localhost:4000";

function getToken() {
  return localStorage.getItem("auth_token");
}

function setToken(token) {
  localStorage.setItem("auth_token", token);
}

function clearToken() {
  localStorage.removeItem("auth_token");
}

async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BACK_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (_err) {
    throw new Error(
      "No se pudo conectar con Back. Asegúrate de tener Node instalado y ejecutar Back en http://localhost:4000"
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Error en el servidor");
  return data;
}

function setEstado(texto) {
  const el = document.getElementById("estadoCuenta");
  const elSesion = document.getElementById("estadoCuentaSesion");
  if (el) el.textContent = texto || "";
  if (elSesion) elSesion.textContent = texto || "";
}

function renderCompras(compras) {
  const cont = document.getElementById("listaCompras");
  if (!cont) return;

  if (!compras || compras.length === 0) {
    cont.innerHTML = `<p>No tienes compras registradas todavía.</p>`;
    return;
  }

  cont.innerHTML = compras
    .map((o) => {
      const items = (o.items || [])
        .map(
          (it) =>
            `<div class="item-carrito">
              <img src="${it.imagen}" class="img-carrito">
              <div class="info-carrito">
                <p>${it.nombre} x${it.cantidad}</p>
                <p>$${it.precio}</p>
              </div>
            </div>`
        )
        .join("");

      return `
        <div class="producto" style="margin-bottom: 1rem;">
          <div class="producto__informacion">
            <p class="producto__nombre">Orden #${o.id}</p>
            <p class="producto__precio">$${o.total}</p>
            <p>Fecha: ${new Date(o.createdAt).toLocaleString()}</p>
          </div>
          <div style="padding: 1rem;">
            ${items}
          </div>
        </div>
      `;
    })
    .join("");
}

function mostrarVistaSinSesion(mensaje) {
  const sinSesion = document.getElementById("cuentaSinSesion");
  const conSesion = document.getElementById("cuentaConSesion");
  if (sinSesion) sinSesion.style.display = "block";
  if (conSesion) conSesion.style.display = "none";
  setEstado(mensaje || "No has iniciado sesión.");
}

let currentAvatarDataUrl = null;

function mostrarVistaConSesion(me) {
  const sinSesion = document.getElementById("cuentaSinSesion");
  const conSesion = document.getElementById("cuentaConSesion");
  const nombreEl = document.getElementById("nombreUsuario");
  const avatarPreview = document.getElementById("avatarPreview");
  const avatarPlaceholder = document.getElementById("avatarPlaceholder");

  if (sinSesion) sinSesion.style.display = "none";
  if (conSesion) conSesion.style.display = "block";

  const nombre = (me && (me.nombre || me.username)) ? (me.nombre || me.username) : "";
  if (nombreEl) nombreEl.textContent = nombre;

  if (avatarPreview && avatarPlaceholder) {
    const avatar = me && me.avatar ? me.avatar : null;
    if (avatar) {
      avatarPreview.src = avatar;
      avatarPreview.style.display = "block";
      avatarPlaceholder.style.display = "none";
    } else {
      avatarPreview.style.display = "none";
      avatarPlaceholder.style.display = "block";
    }
  }
  currentAvatarDataUrl = null;
  setEstado("");
}

async function refrescarUI() {
  const token = getToken();

  if (!token) {
    mostrarVistaSinSesion("No has iniciado sesión.");
    renderCompras([]);
    return;
  }

  try {
    const me = await api("/api/me");
    mostrarVistaConSesion(me);

    const compras = await api("/api/orders");
    renderCompras(compras);
  } catch (e) {
    clearToken();
    mostrarVistaSinSesion("Tu sesión expiró. Inicia sesión de nuevo.");
    renderCompras([]);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("formLogin");
  const formRegister = document.getElementById("formRegister");
  const btnLogout = document.getElementById("btnLogout");

  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userEl = document.getElementById("loginUser");
      const passEl = document.getElementById("loginPass");
      const username = userEl ? String(userEl.value).trim() : "";
      const password = passEl ? String(passEl.value) : "";

      if (!username || !password) {
        setEstado("Completa usuario y contraseña para iniciar sesión.");
        return;
      }

      try {
        const data = await api("/api/auth/login", {
          method: "POST",
          body: { username, password },
          auth: false,
        });
        setToken(data.token);
        await refrescarUI();
      } catch (err) {
        setEstado(err.message);
      }
    });
  }

  if (formRegister) {
    formRegister.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("regNombre") ? String(document.getElementById("regNombre").value).trim() : "";
      const userEl = document.getElementById("regUser");
      const passEl = document.getElementById("regPass");
      const correo = document.getElementById("regCorreo") ? String(document.getElementById("regCorreo").value).trim() : "";
      const documento = document.getElementById("regDocumento") ? String(document.getElementById("regDocumento").value).trim() : "";
      const telefono = document.getElementById("regTelefono") ? String(document.getElementById("regTelefono").value).trim() : "";
      const direccion = document.getElementById("regDireccion") ? String(document.getElementById("regDireccion").value).trim() : "";
      const username = userEl ? String(userEl.value).trim() : "";
      const password = passEl ? String(passEl.value) : "";

      if (!username || !password) {
        setEstado("Completa usuario y contraseña para registrarte.");
        return;
      }
      if (!nombre) {
        setEstado("Completa tu nombre.");
        return;
      }
      if (!correo) {
        setEstado("Completa tu correo electrónico.");
        return;
      }

      try {
        await api("/api/auth/register", {
          method: "POST",
          body: { username, password, nombre, correo, documento, telefono, direccion },
          auth: false,
        });
        formRegister.style.display = "none";

        const btnMostrarRegistro = document.getElementById("btnMostrarRegistro");
        if (btnMostrarRegistro) btnMostrarRegistro.style.display = "block";

        } catch (err) {
          setEstado(err.message);
}
    });
  }
  const avatarInput = document.getElementById("avatarInput");   
  const btnGuardarFoto = document.getElementById("btnGuardarFoto");

  if (avatarInput) {
    avatarInput.addEventListener("change", function () {
      const file = this.files && this.files[0];
      const avatarPreview = document.getElementById("avatarPreview");
      const avatarPlaceholder = document.getElementById("avatarPlaceholder");
      if (!file || !file.type.startsWith("image/")) {
        currentAvatarDataUrl = null;
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        currentAvatarDataUrl = reader.result;
        if (avatarPreview && avatarPlaceholder) {
          avatarPreview.src = currentAvatarDataUrl;
          avatarPreview.style.display = "block";
          avatarPlaceholder.style.display = "none";
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnGuardarFoto) {
    btnGuardarFoto.addEventListener("click", async function () {
      if (!currentAvatarDataUrl) {
        setEstado("Elige una imagen antes de guardar.");
        return;
      }
      try {
        await api("/api/me", {
          method: "PUT",
          body: { avatar: currentAvatarDataUrl },
          auth: true,
        });
        setEstado("Foto guardada.");
        currentAvatarDataUrl = null;
        await refrescarUI();
      } catch (err) {
        setEstado(err.message);
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      clearToken();
      await refrescarUI();
    });
  }

  

  refrescarUI();
});
const btnMostrarRegistro = document.getElementById("btnMostrarRegistro");

if (btnMostrarRegistro && formRegister) {
  btnMostrarRegistro.addEventListener("click", () => {
    formRegister.style.display = "block";
    btnMostrarRegistro.style.display = "none";
  });
}
