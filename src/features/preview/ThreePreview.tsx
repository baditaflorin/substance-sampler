import { useEffect, useRef, useState } from "react";
import type { TextureMap } from "@/features/sampler/types";

interface ThreePreviewProps {
  maps: TextureMap[];
  geometry: "sphere" | "box" | "plane";
}

export function ThreePreview({ maps, geometry }: ThreePreviewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [message, setMessage] = useState("Preview");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || maps.length === 0) {
      return undefined;
    }

    let disposed = false;
    let animation = 0;
    const cleanupFns: Array<() => void> = [];

    async function init() {
      const THREE = await import("three");
      if (disposed || !mount) {
        return;
      }

      const width = Math.max(320, mount.clientWidth);
      const height = Math.max(280, mount.clientHeight);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.innerHTML = "";
      mount.append(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#101820");

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0.4, 3.2);

      const light = new THREE.DirectionalLight("#ffffff", 2.2);
      light.position.set(2.5, 3, 2);
      scene.add(light);
      scene.add(new THREE.AmbientLight("#9fb7c9", 0.8));

      const albedo = textureFor(
        THREE,
        maps.find((map) => map.kind === "albedo")
      );
      const normal = textureFor(
        THREE,
        maps.find((map) => map.kind === "normal")
      );
      const roughness = textureFor(
        THREE,
        maps.find((map) => map.kind === "roughness")
      );
      const ao = textureFor(
        THREE,
        maps.find((map) => map.kind === "ao")
      );
      const metallic = textureFor(
        THREE,
        maps.find((map) => map.kind === "metallic")
      );

      if (albedo) {
        albedo.colorSpace = THREE.SRGBColorSpace;
      }

      const material = new THREE.MeshStandardMaterial({
        map: albedo,
        normalMap: normal,
        roughnessMap: roughness,
        metalnessMap: metallic,
        aoMap: ao,
        roughness: 0.72,
        metalness: metallic ? 1 : 0
      });

      const mesh = new THREE.Mesh(makeGeometry(THREE, geometry), material);
      mesh.geometry.setAttribute(
        "uv2",
        new THREE.BufferAttribute(mesh.geometry.attributes.uv.array, 2)
      );
      scene.add(mesh);

      const resizeObserver = new ResizeObserver(() => {
        const nextWidth = Math.max(320, mount.clientWidth);
        const nextHeight = Math.max(280, mount.clientHeight);
        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(nextWidth, nextHeight);
      });
      resizeObserver.observe(mount);
      cleanupFns.push(() => resizeObserver.disconnect());

      function tick() {
        mesh.rotation.y += 0.006;
        mesh.rotation.x = geometry === "plane" ? -0.15 : Math.sin(Date.now() / 1400) * 0.06;
        renderer.render(scene, camera);
        animation = requestAnimationFrame(tick);
      }

      setMessage("3D preview ready");
      tick();

      cleanupFns.push(() => {
        cancelAnimationFrame(animation);
        renderer.dispose();
        mesh.geometry.dispose();
        material.dispose();
        for (const map of [albedo, normal, roughness, metallic, ao]) {
          map?.dispose();
        }
        renderer.domElement.remove();
      });
    }

    init().catch(() => setMessage("Preview unavailable"));

    return () => {
      disposed = true;
      for (const cleanup of cleanupFns) {
        cleanup();
      }
    };
  }, [geometry, maps]);

  return (
    <section className="preview-panel" aria-label="3D material preview">
      <div className="panel-heading">
        <h2>Material Preview</h2>
        <span>{message}</span>
      </div>
      <div ref={mountRef} className="preview-canvas" data-testid="three-preview" />
    </section>
  );
}

function textureFor(THREE: typeof import("three"), map?: TextureMap) {
  if (!map) {
    return undefined;
  }

  const texture = new THREE.DataTexture(
    new Uint8Array(map.imageData.data),
    map.imageData.width,
    map.imageData.height,
    THREE.RGBAFormat
  );
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function makeGeometry(THREE: typeof import("three"), geometry: ThreePreviewProps["geometry"]) {
  if (geometry === "box") {
    return new THREE.BoxGeometry(1.8, 1.8, 1.8, 96, 96, 96);
  }

  if (geometry === "plane") {
    return new THREE.PlaneGeometry(2.2, 2.2, 160, 160);
  }

  return new THREE.SphereGeometry(1.2, 128, 64);
}
