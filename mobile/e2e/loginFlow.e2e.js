// e2e/loginFlow.e2e.js
// Prueba E2E — Flujo completo de autenticación
// Simula un usuario real: login, dashboard, logout
// Herramienta: Detox (https://wix.github.io/Detox/)

describe('EcoMarket — Flujo de Autenticación (E2E)', () => {
  
  beforeAll(async () => {
    // Limpiar estado de la app antes de cada suite
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Pantalla de Login', () => {

    beforeEach(async () => {
      // Reiniciar app en estado limpio (sin sesión)
      await device.launchApp({
        newInstance: true,
        delete: true, // borra AsyncStorage
      });
    });

    it('muestra la pantalla de login al abrir sin sesión', async () => {
      await waitFor(element(by.text('EcoMarket')))
        .toBeVisible()
        .withTimeout(5000);

      await waitFor(element(by.text('Iniciar sesión')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('muestra error con credenciales incorrectas', async () => {
      await waitFor(element(by.id('input-email')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('input-email')).typeText('usuario@incorrecto.com');
      await element(by.id('input-password')).typeText('claveincorrecta');
      await element(by.id('btn-login')).tap();

      await waitFor(element(by.text(/Error al iniciar sesión|Credenciales/i)))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('login exitoso redirige al Home', async () => {
      await waitFor(element(by.id('input-email')))
        .toBeVisible()
        .withTimeout(5000);

      // Credenciales de prueba (usuario semilla en la BD de dev)
      await element(by.id('input-email')).typeText('test@ecomarket.com');
      await element(by.id('input-password')).typeText('test123456');
      await element(by.id('btn-login')).tap();

      // Debe aparecer el saludo en HomeScreen
      await waitFor(element(by.text(/Hola,/i)))
        .toBeVisible()
        .withTimeout(8000);

      // Debe aparecer la barra de tabs
      await expect(element(by.text('Inicio'))).toBeVisible();
      await expect(element(by.text('Carrito'))).toBeVisible();
    });

  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Persistencia de Sesión', () => {

    it('mantiene la sesión al reiniciar la app', async () => {
      // 1. Hacer login
      await waitFor(element(by.id('input-email')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('input-email')).typeText('test@ecomarket.com');
      await element(by.id('input-password')).typeText('test123456');
      await element(by.id('btn-login')).tap();

      await waitFor(element(by.text(/Hola,/i)))
        .toBeVisible()
        .withTimeout(8000);

      // 2. Reiniciar app SIN borrar datos
      await device.launchApp({ newInstance: false });

      // 3. Debe ir directo al Home (sin pasar por Login)
      await waitFor(element(by.text(/Hola,/i)))
        .toBeVisible()
        .withTimeout(6000);

      // Verificar que NO está en pantalla de login
      await expect(element(by.text('Iniciar sesión'))).not.toBeVisible();
    });

  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Flujo de Registro', () => {

    it('navega a pantalla de registro desde login', async () => {
      await device.launchApp({ newInstance: true, delete: true });

      await waitFor(element(by.text('Regístrate aquí')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('Regístrate aquí')).tap();

      await waitFor(element(by.text('Regístrate')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('muestra error si las contraseñas no coinciden', async () => {
      await device.launchApp({ newInstance: true, delete: true });

      await element(by.text('Regístrate aquí')).tap();

      await waitFor(element(by.id('input-nombre'))).toBeVisible().withTimeout(3000);
      await element(by.id('input-nombre')).typeText('Test User');
      await element(by.id('input-email')).typeText('nuevo@eco.com');
      await element(by.id('input-password')).typeText('password123');
      await element(by.id('input-confirmar')).typeText('password456'); // distinta
      await element(by.id('btn-register')).tap();

      await waitFor(element(by.text(/no coinciden/i)))
        .toBeVisible()
        .withTimeout(3000);
    });

  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Catálogo de Productos', () => {

    beforeEach(async () => {
      // Login previo
      await device.launchApp({ newInstance: true, delete: true });
      await waitFor(element(by.id('input-email'))).toBeVisible().withTimeout(5000);
      await element(by.id('input-email')).typeText('test@ecomarket.com');
      await element(by.id('input-password')).typeText('test123456');
      await element(by.id('btn-login')).tap();
      await waitFor(element(by.text(/Hola,/i))).toBeVisible().withTimeout(8000);
    });

    it('muestra el catálogo de productos', async () => {
      await expect(element(by.text('Agregar'))).toBeVisible();
    });

    it('permite buscar productos', async () => {
      await waitFor(element(by.id('search-input'))).toBeVisible().withTimeout(3000);
      await element(by.id('search-input')).typeText('café');
      await element(by.id('search-input')).tapReturnKey();

      await waitFor(element(by.text(/café/i)))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('agrega producto al carrito', async () => {
      const addButtons = element(by.text('Agregar'));
      await waitFor(addButtons).toBeVisible().withTimeout(5000);

      // Presionar el primer "Agregar"
      await element(by.text('Agregar')).atIndex(0).tap();

      // Debe aparecer confirmación
      await waitFor(element(by.text(/Agregado|carrito/i)))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('navega a la pestaña de carrito', async () => {
      await element(by.text('Carrito')).tap();

      await waitFor(element(by.text(/Mi Carrito/i)))
        .toBeVisible()
        .withTimeout(3000);
    });

  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('Logout', () => {

    it('cierra sesión y regresa a pantalla de login', async () => {
      await device.launchApp({ newInstance: true, delete: true });
      await waitFor(element(by.id('input-email'))).toBeVisible().withTimeout(5000);
      await element(by.id('input-email')).typeText('test@ecomarket.com');
      await element(by.id('input-password')).typeText('test123456');
      await element(by.id('btn-login')).tap();
      await waitFor(element(by.text(/Hola,/i))).toBeVisible().withTimeout(8000);

      // Presionar botón de salir
      await element(by.text('Salir')).tap();

      // Debe volver a la pantalla de login
      await waitFor(element(by.text('Iniciar sesión')))
        .toBeVisible()
        .withTimeout(5000);
    });

  });

});
