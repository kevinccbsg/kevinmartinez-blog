---
title: 'React Router v7: la evolución que React necesitaba'
description: >-
  Si estás leyendo esto, probablemente estés trabajando con React o aprendiendo
  a usarlo. Y si es así, seguro has escuchado hablar de react-router, la
  librería…
date: '2025-05-22'
tags:
  - webdev
  - programming
  - react
  - reactrouter
lang: es
devto_url: >-
  https://dev.to/kevinccbsg/react-router-v7-la-evolucion-que-react-necesitaba-47pc
---
Si estás leyendo esto, probablemente estés trabajando con React o aprendiendo a usarlo. Y si es así, seguro has escuchado hablar de `react-router`, la librería más popular para el manejo de rutas en aplicaciones React desde hace años.

Pero lo que quizás no sabes es que en su versión más reciente, React Router ha evolucionado enormemente. Ahora incorpora conceptos provenientes de **Remix** como los `loader`, `action`, `ErrorBoundaries`, soporte para SSR, entre otros.

¿**Remix**? Exacto. Remix, el framework, siempre ha estado construido sobre React Router. Pero con esta nueva versión (v7), la experiencia se ha unificado, y ahora puedes acceder a esa misma arquitectura directamente desde React Router, sin necesidad de adoptar todo un framework.


## ¿Qué me ofrece React Router v7?

La mejor forma de entender qué ofrece React Router v7 es explorando sus tres modos de uso, cada uno diseñado para distintos niveles de complejidad y necesidades en tu aplicación:

1. Modo Declarativo
2. Modo Data
3. Modo Framework

A continuación te explico qué es cada uno y cuándo conviene usarlos.

### Modo Declarativo

Este es el enfoque clásico que probablemente ya conoces. Usamos componentes como `<Routes>` y `<Route>` para definir nuestras rutas, junto con hooks como `useNavigate`, `useParams`, etc.

```js
<Routes>
  <Route index element={<Home />} />
  <Route path="about" element={<About />} />

  <Route element={<AuthLayout />}>
    <Route path="login" element={<Login />} />
    <Route path="register" element={<Register />} />
  </Route>

  <Route path="concerts">
    <Route index element={<ConcertsHome />} />
    <Route path=":city" element={<City />} />
    <Route path="trending" element={<Trending />} />
  </Route>
</Routes>
```

Este modo es perfecto si quieres una SPA sencilla, usando tu propio bundler (Vite, Webpack...), gestionando estado con Zustand, Redux o react-query, y si no necesitas renderizado en el servidor (SSR).

### Modo Data

Aquí es donde React Router v7 realmente se transforma. En lugar de usar componentes para definir las rutas, trabajas con una configuración en forma de objeto, y puedes asociar cada ruta a un loader (para cargar datos) y a un action (para manejar formularios o mutaciones).

```js
const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Hello World</div>,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

Un ejemplo más completo con `loader `y `action`:

```js
createBrowserRouter([
  {
    path: "/items",
    loader,
    action,
    Component: Items,
  },
]);

async function loader() {
  const items = await fakeDb.getItems();
  return { items };
}

async function action({ request }) {
  const data = await request.formData();
  await fakeDb.addItem({ title: data.get("title") });
  return { ok: true };
}

function Items() {
  const data = useLoaderData();
  return (
    <div>
      <TodoList items={data.items} />
      <Form method="post">
        <input type="text" name="title" />
        <button type="submit">Crear</button>
      </Form>
    </div>
  );
}
```

Este modo es ideal si estás desarrollando una SPA compleja y quieres evitar el caos de múltiples useEffect, centralizando el flujo de datos. Además, puedes mantener tu stack actual y hacer deploy donde quieras (Vercel, Netlify, Firebase, etc.).

📌 Te recomiendo visitar este repo con [ejemplos](https://github.com/kevinccbsg/react-router-tutorials/tree/main/react-router-data), y atento/a porque publicaré más artículos sobre cómo sacarle provecho a este modo.

### Modo Framework

Este modo convierte React Router en un framework completo con soporte para SSR. Se inicia desde cero con una CLI, y está pensado para quienes necesitan SEO o tiempos de carga inicial muy rápidos.

Tiene el mejor tipado, comparte los conceptos de `loaders` y `actions` con el modo Data, y te da control total.

👉 Sin embargo, ten en cuenta:

- Necesitas tener claro desde el principio tu entorno de deploy.
- No todas las librerías funcionan bien en SSR.
- El equipo de desarrollo debe entender la diferencia entre renderizado del cliente (CSR) y del servidor (SSR).
- Funciona mejor con Tailwind u opciones de estilos compatibles con SSR.

Ahora bien, si tu app es privada o no necesita SEO, te recomendaría mantenerte en modo Declarativo o Data para evitar la complejidad innecesaria.

## ¿Entonces, vale la pena?

Hoy en día muchos frameworks de React están añadiendo complejidad al frontend con sus últimos cambios. React Router v7 te da una alternativa clara y flexible:

- Puedes comenzar con el modo Declarativo si solo necesitas routing.
- Pasar al modo Data si quieres mejorar la gestión de datos.
- Y dar el salto a modo Framework si realmente necesitas SSR.

Todo sin tener que casarte con un único enfoque desde el inicio.

💡 En los próximos artículos voy a profundizar en `loaders`, `actions` y arquitectura en modo Data, con proyectos desde cero, testing e integraciones comunes del día a día.

¿Te interesa React Router v7? ¿Quieres ver ejemplos prácticos o comparativas con otras soluciones? Déjamelo en los comentarios, estaré encantado de responder.
