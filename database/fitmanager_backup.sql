--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS fk_usuario_rol;
ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS fk_usuario_persona;
ALTER TABLE IF EXISTS ONLY public.suscripcion DROP CONSTRAINT IF EXISTS fk_suscripcion_membresia;
ALTER TABLE IF EXISTS ONLY public.suscripcion DROP CONSTRAINT IF EXISTS fk_suscripcion_cliente;
ALTER TABLE IF EXISTS ONLY public.rutina DROP CONSTRAINT IF EXISTS fk_rutina_entrenador;
ALTER TABLE IF EXISTS ONLY public.rutina DROP CONSTRAINT IF EXISTS fk_rutina_cliente;
ALTER TABLE IF EXISTS ONLY public.reserva_clase DROP CONSTRAINT IF EXISTS fk_reserva_prog;
ALTER TABLE IF EXISTS ONLY public.reserva_clase DROP CONSTRAINT IF EXISTS fk_reserva_cliente;
ALTER TABLE IF EXISTS ONLY public.programacion_clase DROP CONSTRAINT IF EXISTS fk_prog_sede;
ALTER TABLE IF EXISTS ONLY public.programacion_clase DROP CONSTRAINT IF EXISTS fk_prog_entrenador;
ALTER TABLE IF EXISTS ONLY public.programacion_clase DROP CONSTRAINT IF EXISTS fk_prog_clase;
ALTER TABLE IF EXISTS ONLY public.pago DROP CONSTRAINT IF EXISTS fk_pago_factura;
ALTER TABLE IF EXISTS ONLY public.factura DROP CONSTRAINT IF EXISTS fk_factura_suscripcion;
ALTER TABLE IF EXISTS ONLY public.entrenador DROP CONSTRAINT IF EXISTS fk_entrenador_sede;
ALTER TABLE IF EXISTS ONLY public.entrenador DROP CONSTRAINT IF EXISTS fk_entrenador_persona;
ALTER TABLE IF EXISTS ONLY public.detalle_rutina DROP CONSTRAINT IF EXISTS fk_detalle_rutina;
ALTER TABLE IF EXISTS ONLY public.detalle_rutina DROP CONSTRAINT IF EXISTS fk_detalle_ejercicio;
ALTER TABLE IF EXISTS ONLY public.control_acceso DROP CONSTRAINT IF EXISTS fk_acceso_sede;
ALTER TABLE IF EXISTS ONLY public.control_acceso DROP CONSTRAINT IF EXISTS fk_acceso_cliente;
DROP INDEX IF EXISTS public.idx_suscripcion_cliente_estado;
DROP INDEX IF EXISTS public.idx_acceso_ingreso;
ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS usuario_username_key;
ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS usuario_pkey;
ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS usuario_id_persona_key;
ALTER TABLE IF EXISTS ONLY public.reserva_clase DROP CONSTRAINT IF EXISTS uq_reserva;
ALTER TABLE IF EXISTS ONLY public.suscripcion DROP CONSTRAINT IF EXISTS suscripcion_pkey;
ALTER TABLE IF EXISTS ONLY public.sede DROP CONSTRAINT IF EXISTS sede_pkey;
ALTER TABLE IF EXISTS ONLY public.rutina DROP CONSTRAINT IF EXISTS rutina_pkey;
ALTER TABLE IF EXISTS ONLY public.rol DROP CONSTRAINT IF EXISTS rol_pkey;
ALTER TABLE IF EXISTS ONLY public.rol DROP CONSTRAINT IF EXISTS rol_nombre_key;
ALTER TABLE IF EXISTS ONLY public.reserva_clase DROP CONSTRAINT IF EXISTS reserva_clase_pkey;
ALTER TABLE IF EXISTS ONLY public.programacion_clase DROP CONSTRAINT IF EXISTS programacion_clase_pkey;
ALTER TABLE IF EXISTS ONLY public.persona DROP CONSTRAINT IF EXISTS persona_pkey;
ALTER TABLE IF EXISTS ONLY public.persona DROP CONSTRAINT IF EXISTS persona_documento_identidad_key;
ALTER TABLE IF EXISTS ONLY public.pago DROP CONSTRAINT IF EXISTS pago_referencia_pago_key;
ALTER TABLE IF EXISTS ONLY public.pago DROP CONSTRAINT IF EXISTS pago_pkey;
ALTER TABLE IF EXISTS ONLY public.membresia DROP CONSTRAINT IF EXISTS membresia_pkey;
ALTER TABLE IF EXISTS ONLY public.membresia DROP CONSTRAINT IF EXISTS membresia_nombre_key;
ALTER TABLE IF EXISTS ONLY public.factura DROP CONSTRAINT IF EXISTS factura_pkey;
ALTER TABLE IF EXISTS ONLY public.factura DROP CONSTRAINT IF EXISTS factura_numero_factura_key;
ALTER TABLE IF EXISTS ONLY public.entrenador DROP CONSTRAINT IF EXISTS entrenador_pkey;
ALTER TABLE IF EXISTS ONLY public.entrenador DROP CONSTRAINT IF EXISTS entrenador_id_persona_key;
ALTER TABLE IF EXISTS ONLY public.ejercicio DROP CONSTRAINT IF EXISTS ejercicio_pkey;
ALTER TABLE IF EXISTS ONLY public.ejercicio DROP CONSTRAINT IF EXISTS ejercicio_nombre_ejercicio_key;
ALTER TABLE IF EXISTS ONLY public.detalle_rutina DROP CONSTRAINT IF EXISTS detalle_rutina_pkey;
ALTER TABLE IF EXISTS ONLY public.control_acceso DROP CONSTRAINT IF EXISTS control_acceso_pkey;
ALTER TABLE IF EXISTS ONLY public.clase DROP CONSTRAINT IF EXISTS clase_pkey;
ALTER TABLE IF EXISTS ONLY public.clase DROP CONSTRAINT IF EXISTS clase_nombre_clase_key;
DROP TABLE IF EXISTS public.usuario;
DROP TABLE IF EXISTS public.suscripcion;
DROP TABLE IF EXISTS public.sede;
DROP TABLE IF EXISTS public.rutina;
DROP TABLE IF EXISTS public.rol;
DROP TABLE IF EXISTS public.reserva_clase;
DROP TABLE IF EXISTS public.programacion_clase;
DROP TABLE IF EXISTS public.persona;
DROP TABLE IF EXISTS public.pago;
DROP TABLE IF EXISTS public.membresia;
DROP TABLE IF EXISTS public.factura;
DROP TABLE IF EXISTS public.entrenador;
DROP TABLE IF EXISTS public.ejercicio;
DROP TABLE IF EXISTS public.detalle_rutina;
DROP TABLE IF EXISTS public.control_acceso;
DROP TABLE IF EXISTS public.clase;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clase (
    id_clase integer NOT NULL,
    nombre_clase character varying(80) NOT NULL,
    descripcion text,
    capacidad_maxima integer NOT NULL,
    CONSTRAINT clase_capacidad_maxima_check CHECK ((capacidad_maxima > 0))
);


--
-- Name: clase_id_clase_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clase ALTER COLUMN id_clase ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.clase_id_clase_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: control_acceso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.control_acceso (
    id_acceso bigint NOT NULL,
    id_cliente integer NOT NULL,
    id_sede integer NOT NULL,
    fecha_hora_ingreso timestamp(0) without time zone DEFAULT LOCALTIMESTAMP(0) NOT NULL,
    fecha_hora_salida timestamp(0) without time zone
);


--
-- Name: control_acceso_id_acceso_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.control_acceso ALTER COLUMN id_acceso ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.control_acceso_id_acceso_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: detalle_rutina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_rutina (
    id_detalle integer NOT NULL,
    id_rutina integer NOT NULL,
    id_ejercicio integer NOT NULL,
    series integer NOT NULL,
    repeticiones integer NOT NULL,
    descanso_segundos integer DEFAULT 60 NOT NULL,
    orden integer DEFAULT 1 NOT NULL,
    CONSTRAINT detalle_rutina_descanso_segundos_check CHECK ((descanso_segundos >= 0)),
    CONSTRAINT detalle_rutina_repeticiones_check CHECK ((repeticiones > 0)),
    CONSTRAINT detalle_rutina_series_check CHECK ((series > 0))
);


--
-- Name: detalle_rutina_id_detalle_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.detalle_rutina ALTER COLUMN id_detalle ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.detalle_rutina_id_detalle_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ejercicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ejercicio (
    id_ejercicio integer NOT NULL,
    nombre_ejercicio character varying(100) NOT NULL,
    grupo_muscular character varying(50) NOT NULL,
    descripcion text
);


--
-- Name: ejercicio_id_ejercicio_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ejercicio ALTER COLUMN id_ejercicio ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ejercicio_id_ejercicio_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: entrenador; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entrenador (
    id_entrenador integer NOT NULL,
    id_persona integer NOT NULL,
    id_sede integer NOT NULL,
    especialidad character varying(100)
);


--
-- Name: entrenador_id_entrenador_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.entrenador ALTER COLUMN id_entrenador ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.entrenador_id_entrenador_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: factura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factura (
    id_factura integer NOT NULL,
    id_suscripcion integer NOT NULL,
    numero_factura character varying(50) NOT NULL,
    fecha_emision timestamp(0) without time zone DEFAULT LOCALTIMESTAMP(0) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    descuento numeric(10,2) DEFAULT 0 NOT NULL,
    impuesto numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    estado character varying(10) DEFAULT 'Pendiente'::character varying NOT NULL,
    CONSTRAINT factura_estado_check CHECK (((estado)::text = ANY ((ARRAY['Pendiente'::character varying, 'Pagada'::character varying, 'Anulada'::character varying])::text[])))
);


--
-- Name: factura_id_factura_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.factura ALTER COLUMN id_factura ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.factura_id_factura_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: membresia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membresia (
    id_membresia integer NOT NULL,
    nombre character varying(80) NOT NULL,
    descripcion text,
    precio numeric(10,2) NOT NULL,
    duracion_dias integer NOT NULL,
    estado character varying(10) DEFAULT 'Activa'::character varying NOT NULL,
    CONSTRAINT membresia_duracion_dias_check CHECK ((duracion_dias > 0)),
    CONSTRAINT membresia_estado_check CHECK (((estado)::text = ANY ((ARRAY['Activa'::character varying, 'Inactiva'::character varying])::text[]))),
    CONSTRAINT membresia_precio_check CHECK ((precio >= (0)::numeric))
);


--
-- Name: membresia_id_membresia_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.membresia ALTER COLUMN id_membresia ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.membresia_id_membresia_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pago (
    id_pago integer NOT NULL,
    id_factura integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha_pago timestamp(0) without time zone DEFAULT LOCALTIMESTAMP(0) NOT NULL,
    metodo_pago character varying(15) NOT NULL,
    estado_pago character varying(10) DEFAULT 'Aprobado'::character varying NOT NULL,
    referencia_pago character varying(100),
    concepto character varying(150),
    CONSTRAINT pago_estado_pago_check CHECK (((estado_pago)::text = ANY ((ARRAY['Pendiente'::character varying, 'Aprobado'::character varying, 'Rechazado'::character varying, 'Anulado'::character varying])::text[]))),
    CONSTRAINT pago_metodo_pago_check CHECK (((metodo_pago)::text = ANY ((ARRAY['Efectivo'::character varying, 'Tarjeta'::character varying, 'Transferencia'::character varying, 'PSE'::character varying])::text[]))),
    CONSTRAINT pago_monto_check CHECK ((monto > (0)::numeric))
);


--
-- Name: pago_id_pago_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pago ALTER COLUMN id_pago ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pago_id_pago_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: persona; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persona (
    id_persona integer NOT NULL,
    documento_identidad character varying(20) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    fecha_nacimiento date,
    email character varying(120),
    telefono character varying(20),
    fecha_registro date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: persona_id_persona_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.persona ALTER COLUMN id_persona ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.persona_id_persona_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: programacion_clase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programacion_clase (
    id_programacion integer NOT NULL,
    id_clase integer NOT NULL,
    id_entrenador integer NOT NULL,
    id_sede integer NOT NULL,
    fecha_hora_inicio timestamp(0) without time zone NOT NULL,
    duracion_minutos integer NOT NULL,
    CONSTRAINT programacion_clase_duracion_minutos_check CHECK ((duracion_minutos > 0))
);


--
-- Name: programacion_clase_id_programacion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.programacion_clase ALTER COLUMN id_programacion ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.programacion_clase_id_programacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reserva_clase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reserva_clase (
    id_reserva integer NOT NULL,
    id_cliente integer NOT NULL,
    id_programacion integer NOT NULL,
    fecha_reserva timestamp(0) without time zone DEFAULT LOCALTIMESTAMP(0) NOT NULL,
    estado_reserva character varying(10) DEFAULT 'Confirmada'::character varying NOT NULL,
    CONSTRAINT reserva_clase_estado_reserva_check CHECK (((estado_reserva)::text = ANY ((ARRAY['Confirmada'::character varying, 'Asistio'::character varying, 'Cancelada'::character varying])::text[])))
);


--
-- Name: reserva_clase_id_reserva_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.reserva_clase ALTER COLUMN id_reserva ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reserva_clase_id_reserva_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol (
    id_rol integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion character varying(150)
);


--
-- Name: rol_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rol ALTER COLUMN id_rol ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rol_id_rol_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rutina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rutina (
    id_rutina integer NOT NULL,
    id_cliente integer NOT NULL,
    id_entrenador integer NOT NULL,
    nombre_rutina character varying(100) NOT NULL,
    objetivo character varying(150),
    fecha_asignacion date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: rutina_id_rutina_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rutina ALTER COLUMN id_rutina ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rutina_id_rutina_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sede; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sede (
    id_sede integer NOT NULL,
    nombre character varying(100) NOT NULL,
    direccion character varying(200) NOT NULL,
    telefono character varying(20),
    estado character varying(10) DEFAULT 'Activa'::character varying NOT NULL,
    CONSTRAINT sede_estado_check CHECK (((estado)::text = ANY ((ARRAY['Activa'::character varying, 'Inactiva'::character varying])::text[])))
);


--
-- Name: sede_id_sede_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sede ALTER COLUMN id_sede ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sede_id_sede_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: suscripcion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suscripcion (
    id_suscripcion integer NOT NULL,
    id_cliente integer NOT NULL,
    id_membresia integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    estado character varying(10) DEFAULT 'Pendiente'::character varying NOT NULL,
    CONSTRAINT ck_suscripcion_fechas CHECK ((fecha_fin >= fecha_inicio)),
    CONSTRAINT suscripcion_estado_check CHECK (((estado)::text = ANY ((ARRAY['Pendiente'::character varying, 'Activa'::character varying, 'Vencida'::character varying, 'Cancelada'::character varying])::text[])))
);


--
-- Name: suscripcion_id_suscripcion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.suscripcion ALTER COLUMN id_suscripcion ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.suscripcion_id_suscripcion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    id_usuario integer NOT NULL,
    id_persona integer NOT NULL,
    id_rol integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    fecha_creacion timestamp(0) without time zone DEFAULT LOCALTIMESTAMP(0) NOT NULL
);


--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.usuario ALTER COLUMN id_usuario ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuario_id_usuario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: clase; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clase (id_clase, nombre_clase, descripcion, capacidad_maxima) FROM stdin;
1	Spinning	Ciclismo indoor de alta intensidad	20
2	Yoga	Flexibilidad, respiración y equilibrio	15
3	Zumba	Baile fitness con ritmos latinos	25
4	Crossfit	Entrenamiento funcional de alta intensidad	12
5	Pilates	Fortalecimiento del core y postura	15
\.


--
-- Data for Name: control_acceso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.control_acceso (id_acceso, id_cliente, id_sede, fecha_hora_ingreso, fecha_hora_salida) FROM stdin;
1	6	1	2026-09-22 16:12:00	2026-09-22 17:32:00
2	12	1	2026-09-22 17:12:00	2026-09-22 19:08:00
3	6	1	2026-09-22 09:04:00	2026-09-22 10:24:00
4	12	1	2026-09-22 16:12:00	2026-09-22 17:16:00
5	10	1	2026-09-23 08:36:00	2026-09-23 10:04:00
6	14	1	2026-09-23 15:40:00	2026-09-23 16:34:00
7	10	1	2026-09-23 14:04:00	2026-09-23 15:16:00
8	8	1	2026-09-23 10:52:00	2026-09-23 12:30:00
9	6	1	2026-09-23 10:48:00	2026-09-23 12:46:00
10	14	1	2026-09-23 14:36:00	2026-09-23 15:58:00
11	8	1	2026-09-24 18:00:00	2026-09-24 19:00:00
12	8	1	2026-09-24 11:12:00	2026-09-24 12:22:00
13	6	1	2026-09-24 13:32:00	2026-09-24 15:04:00
14	14	1	2026-09-24 13:56:00	2026-09-24 15:20:00
15	12	1	2026-09-24 11:36:00	2026-09-24 12:26:00
16	12	2	2026-09-24 18:24:00	2026-09-24 19:24:00
17	10	1	2026-09-25 12:48:00	2026-09-25 14:46:00
18	12	1	2026-09-25 08:48:00	2026-09-25 09:50:00
19	12	1	2026-09-25 17:00:00	2026-09-25 17:50:00
20	12	1	2026-09-25 09:48:00	2026-09-25 11:22:00
21	7	1	2026-09-26 12:04:00	2026-09-26 13:30:00
22	12	1	2026-09-26 13:52:00	2026-09-26 15:28:00
23	10	1	2026-09-26 14:52:00	2026-09-26 16:34:00
24	10	1	2026-09-26 17:00:00	2026-09-26 18:12:00
25	12	1	2026-09-26 20:48:00	2026-09-26 22:34:00
26	10	1	2026-09-27 11:48:00	2026-09-27 13:06:00
27	8	1	2026-09-27 11:40:00	2026-09-27 13:20:00
28	12	1	2026-09-27 13:16:00	2026-09-27 14:48:00
29	6	1	2026-09-27 18:48:00	2026-09-27 19:38:00
30	10	1	2026-09-28 07:04:00	2026-09-28 08:38:00
31	8	1	2026-09-28 06:12:00	2026-09-28 07:42:00
32	12	1	2026-09-28 08:36:00	2026-09-28 10:18:00
33	10	1	2026-09-28 13:28:00	2026-09-28 15:26:00
34	14	1	2026-09-28 19:44:00	2026-09-28 20:48:00
35	14	1	2026-09-28 15:36:00	2026-09-28 16:54:00
36	10	1	2026-09-28 14:44:00	2026-09-28 16:32:00
37	14	1	2026-09-29 15:44:00	2026-09-29 16:54:00
38	10	1	2026-09-29 17:12:00	2026-09-29 18:08:00
39	14	1	2026-09-29 20:12:00	2026-09-29 21:18:00
40	10	1	2026-09-30 14:52:00	2026-09-30 15:58:00
41	12	1	2026-09-30 09:44:00	2026-09-30 11:40:00
42	10	1	2026-09-30 07:04:00	2026-09-30 08:40:00
43	8	1	2026-09-30 19:32:00	2026-09-30 21:24:00
44	6	1	2026-09-30 20:28:00	2026-09-30 21:38:00
45	14	1	2026-09-30 09:28:00	2026-09-30 11:06:00
46	6	1	2026-09-30 14:20:00	2026-09-30 15:52:00
47	8	1	2026-10-01 19:08:00	2026-10-01 20:44:00
48	8	1	2026-10-01 16:56:00	2026-10-01 17:58:00
49	14	1	2026-10-01 20:44:00	2026-10-01 22:42:00
50	12	1	2026-10-01 15:28:00	2026-10-01 16:44:00
51	6	1	2026-10-01 17:56:00	2026-10-01 19:30:00
52	12	1	2026-10-02 10:44:00	2026-10-02 12:00:00
53	14	1	2026-10-02 14:32:00	2026-10-02 15:28:00
54	10	1	2026-10-02 06:24:00	2026-10-02 07:56:00
55	12	1	2026-10-02 17:08:00	2026-10-02 18:10:00
56	6	1	2026-10-03 20:04:00	2026-10-03 21:56:00
57	6	1	2026-10-03 20:20:00	2026-10-03 21:52:00
58	10	1	2026-10-03 11:16:00	2026-10-03 12:14:00
59	12	1	2026-10-03 18:16:00	2026-10-03 19:20:00
60	12	1	2026-10-04 08:40:00	2026-10-04 10:16:00
61	12	1	2026-10-04 19:32:00	2026-10-04 20:22:00
62	14	1	2026-10-04 16:00:00	2026-10-04 17:14:00
63	12	1	2026-10-04 10:40:00	2026-10-04 12:14:00
64	10	1	2026-10-05 20:20:00	2026-10-05 22:04:00
65	6	1	2026-10-05 09:20:00	2026-10-05 11:04:00
66	6	1	2026-10-05 11:12:00	2026-10-05 12:42:00
67	12	1	2026-10-05 07:56:00	2026-10-05 09:28:00
68	14	1	2026-10-05 16:44:00	2026-10-05 18:42:00
69	12	1	2026-10-05 07:52:00	2026-10-05 08:58:00
70	12	1	2026-10-06 07:08:00	2026-10-06 08:50:00
71	6	1	2026-10-06 15:56:00	2026-10-06 16:48:00
72	14	1	2026-10-06 13:12:00	2026-10-06 14:40:00
73	6	1	2026-10-07 19:24:00	2026-10-07 20:28:00
74	6	1	2026-10-07 16:04:00	2026-10-07 17:40:00
75	12	1	2026-10-07 12:12:00	2026-10-07 13:56:00
76	10	1	2026-10-07 17:56:00	2026-10-07 19:32:00
77	12	1	2026-10-07 08:24:00	2026-10-07 09:22:00
78	8	1	2026-10-07 16:16:00	2026-10-07 17:34:00
79	14	1	2026-10-07 07:56:00	2026-10-07 09:54:00
80	6	1	2026-10-08 16:12:00	2026-10-08 17:55:00
81	14	1	2026-10-08 10:52:00	2026-10-08 11:56:00
82	12	1	2026-10-08 20:56:00	2026-10-08 22:08:00
83	12	1	2026-10-08 12:48:00	2026-10-08 13:52:00
84	14	1	2026-10-09 20:20:00	2026-10-09 21:36:00
85	6	1	2026-10-09 19:28:00	2026-10-09 20:54:00
86	14	1	2026-10-09 12:48:00	2026-10-09 14:30:00
87	14	1	2026-10-09 19:52:00	2026-10-09 21:02:00
88	8	1	2026-10-09 11:36:00	2026-10-09 13:26:00
89	10	1	2026-10-10 17:08:00	2026-10-10 18:56:00
90	10	1	2026-10-10 11:52:00	2026-10-10 13:46:00
91	10	2	2026-10-10 06:32:00	2026-10-10 08:08:00
92	12	1	2026-10-10 12:48:00	2026-10-10 13:52:00
93	10	1	2026-10-11 09:00:00	2026-10-11 10:28:00
94	10	1	2026-10-11 15:48:00	2026-10-11 17:32:00
95	12	1	2026-10-11 13:24:00	2026-10-11 14:50:00
96	14	1	2026-10-11 08:12:00	2026-10-11 09:46:00
97	6	1	2026-10-12 13:00:00	2026-10-12 13:52:00
98	8	1	2026-10-12 08:40:00	2026-10-12 10:26:00
99	14	1	2026-10-12 20:00:00	2026-10-12 21:52:00
100	14	1	2026-10-12 06:12:00	2026-10-12 07:32:00
101	6	1	2026-10-12 07:16:00	2026-10-12 08:46:00
102	10	1	2026-10-12 11:28:00	2026-10-12 13:06:00
103	6	1	2026-10-13 09:00:00	2026-10-13 10:26:00
104	8	1	2026-10-13 15:44:00	2026-10-13 17:24:00
105	14	1	2026-10-13 15:00:00	2026-10-13 16:50:00
106	14	1	2026-10-13 09:28:00	2026-10-13 10:34:00
107	10	1	2026-10-13 08:20:00	2026-10-13 09:32:00
108	8	1	2026-10-14 19:48:00	2026-10-14 20:48:00
109	12	1	2026-10-14 06:08:00	2026-10-14 07:18:00
110	14	1	2026-10-14 20:12:00	2026-10-14 21:34:00
111	6	1	2026-10-14 09:48:00	2026-10-14 11:38:00
112	8	1	2026-10-14 16:20:00	2026-10-14 18:00:00
113	12	1	2026-10-14 15:48:00	2026-10-14 16:38:00
114	14	1	2026-10-15 14:28:00	2026-10-15 15:32:00
115	8	1	2026-10-15 08:08:00	2026-10-15 10:00:00
116	10	1	2026-10-15 20:52:00	2026-10-15 22:06:00
117	10	1	2026-10-15 06:00:00	2026-10-15 07:20:00
118	14	1	2026-10-16 19:04:00	2026-10-16 19:56:00
119	12	1	2026-10-16 13:04:00	2026-10-16 14:34:00
120	10	1	2026-10-16 15:44:00	2026-10-16 17:22:00
121	12	1	2026-10-16 09:48:00	2026-10-16 10:54:00
122	14	1	2026-10-16 17:00:00	2026-10-16 17:58:00
123	12	1	2026-10-17 16:36:00	2026-10-17 18:00:00
124	14	1	2026-10-17 20:56:00	2026-10-17 22:06:00
125	8	1	2026-10-17 15:24:00	2026-10-17 16:16:00
126	14	1	2026-10-17 15:24:00	2026-10-17 16:52:00
127	12	1	2026-10-17 12:04:00	2026-10-17 13:34:00
128	14	1	2026-10-17 09:36:00	2026-10-17 10:32:00
129	10	1	2026-10-18 20:36:00	2026-10-18 22:28:00
130	14	1	2026-10-18 17:56:00	2026-10-18 19:32:00
131	8	1	2026-10-18 09:40:00	2026-10-18 11:02:00
132	12	1	2026-10-18 16:28:00	2026-10-18 17:56:00
133	8	1	2026-10-19 16:28:00	2026-10-19 17:44:00
134	14	1	2026-10-19 13:08:00	2026-10-19 14:36:00
135	6	2	2026-10-19 09:12:00	2026-10-19 10:10:00
136	14	1	2026-10-19 13:36:00	2026-10-19 14:50:00
137	6	1	2026-10-20 07:08:00	2026-10-20 08:52:00
138	14	1	2026-10-20 12:12:00	2026-10-20 14:04:00
139	10	1	2026-10-20 12:44:00	2026-10-20 13:56:00
140	10	1	2026-10-21 10:00:00	2026-10-21 11:02:00
141	8	1	2026-10-21 18:00:00	2026-10-21 19:34:00
142	10	1	2026-10-21 18:24:00	2026-10-21 19:58:00
143	6	1	2026-10-22 21:53:34	\N
144	7	2	2026-10-22 21:38:34	\N
145	8	1	2026-10-22 21:23:34	\N
\.


--
-- Data for Name: detalle_rutina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalle_rutina (id_detalle, id_rutina, id_ejercicio, series, repeticiones, descanso_segundos, orden) FROM stdin;
1	1	1	3	8	45	1
2	1	5	3	10	45	2
3	1	9	3	8	45	3
4	1	2	3	11	45	4
5	1	10	3	12	45	5
6	2	9	3	11	45	1
7	2	1	3	9	45	2
8	2	5	3	9	45	3
9	2	6	3	12	45	4
10	2	2	3	10	45	5
11	3	9	3	11	45	1
12	3	5	3	12	45	2
13	3	1	3	10	45	3
14	3	6	3	9	45	4
15	3	2	3	8	45	5
16	4	9	3	10	45	1
17	4	5	3	8	45	2
18	4	1	3	10	45	3
19	4	10	3	9	45	4
20	4	6	3	10	45	5
21	5	5	3	12	45	1
22	5	1	3	8	45	2
23	5	9	3	10	45	3
24	5	10	3	8	45	4
25	5	2	3	12	45	5
26	6	5	3	11	45	1
27	6	1	3	12	45	2
28	6	9	3	10	45	3
29	6	6	3	10	45	4
30	6	2	3	9	45	5
\.


--
-- Data for Name: ejercicio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ejercicio (id_ejercicio, nombre_ejercicio, grupo_muscular, descripcion) FROM stdin;
1	Press de banca	Pecho	Ejercicio de pecho con técnica controlada
2	Sentadilla libre	Piernas	Ejercicio de piernas con técnica controlada
3	Peso muerto	Espalda	Ejercicio de espalda con técnica controlada
4	Dominadas	Espalda	Ejercicio de espalda con técnica controlada
5	Press militar	Hombros	Ejercicio de hombros con técnica controlada
6	Curl de bíceps	Brazos	Ejercicio de brazos con técnica controlada
7	Fondos en paralelas	Brazos	Ejercicio de brazos con técnica controlada
8	Plancha abdominal	Core	Ejercicio de core con técnica controlada
9	Zancadas	Piernas	Ejercicio de piernas con técnica controlada
10	Remo con barra	Espalda	Ejercicio de espalda con técnica controlada
11	Elevaciones laterales	Hombros	Ejercicio de hombros con técnica controlada
12	Hip thrust	Glúteos	Ejercicio de glúteos con técnica controlada
\.


--
-- Data for Name: entrenador; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.entrenador (id_entrenador, id_persona, id_sede, especialidad) FROM stdin;
1	3	1	Fuerza e hipertrofia
2	4	1	Yoga y pilates
3	5	2	Funcional y crossfit
\.


--
-- Data for Name: factura; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.factura (id_factura, id_suscripcion, numero_factura, fecha_emision, subtotal, descuento, impuesto, total, estado) FROM stdin;
1	1	FAC-00001	2026-05-05 09:15:00	90000.00	0.00	17100.00	107100.00	Pagada
2	2	FAC-00002	2026-06-04 10:15:00	90000.00	0.00	17100.00	107100.00	Pagada
3	3	FAC-00003	2026-07-04 11:15:00	90000.00	0.00	17100.00	107100.00	Pagada
4	4	FAC-00004	2026-08-03 12:15:00	240000.00	0.00	45600.00	285600.00	Pagada
5	5	FAC-00005	2026-05-02 13:15:00	90000.00	0.00	17100.00	107100.00	Pagada
6	6	FAC-00006	2026-06-02 14:15:00	90000.00	0.00	17100.00	107100.00	Pagada
7	7	FAC-00007	2026-07-03 15:15:00	90000.00	0.00	17100.00	107100.00	Pagada
8	8	FAC-00008	2026-08-02 16:15:00	240000.00	0.00	45600.00	285600.00	Pagada
9	9	FAC-00009	2026-04-29 09:15:00	90000.00	0.00	17100.00	107100.00	Pagada
10	10	FAC-00010	2026-05-31 10:15:00	90000.00	0.00	17100.00	107100.00	Pagada
11	11	FAC-00011	2026-07-02 11:15:00	90000.00	0.00	17100.00	107100.00	Pagada
12	12	FAC-00012	2026-08-01 12:15:00	240000.00	0.00	45600.00	285600.00	Pagada
13	13	FAC-00013	2026-04-26 13:15:00	90000.00	0.00	17100.00	107100.00	Pagada
14	14	FAC-00014	2026-05-29 14:15:00	90000.00	0.00	17100.00	107100.00	Pagada
15	15	FAC-00015	2026-07-01 15:15:00	90000.00	0.00	17100.00	107100.00	Pagada
16	16	FAC-00016	2026-07-31 16:15:00	240000.00	0.00	45600.00	285600.00	Pagada
17	17	FAC-00017	2026-04-23 09:15:00	90000.00	0.00	17100.00	107100.00	Pagada
18	18	FAC-00018	2026-05-27 10:15:00	90000.00	0.00	17100.00	107100.00	Pagada
19	19	FAC-00019	2026-06-30 11:15:00	90000.00	0.00	17100.00	107100.00	Pagada
20	20	FAC-00020	2026-04-20 12:15:00	90000.00	0.00	17100.00	107100.00	Pagada
21	21	FAC-00021	2026-05-25 13:15:00	90000.00	0.00	17100.00	107100.00	Pagada
22	22	FAC-00022	2026-06-29 14:15:00	90000.00	0.00	17100.00	107100.00	Pagada
23	23	FAC-00023	2026-04-17 15:15:00	90000.00	0.00	17100.00	107100.00	Pagada
24	24	FAC-00024	2026-04-14 16:15:00	90000.00	0.00	17100.00	107100.00	Pagada
25	25	FAC-00025	2026-10-02 09:15:00	240000.00	0.00	45600.00	285600.00	Pagada
26	26	FAC-00026	2026-09-07 10:15:00	450000.00	0.00	85500.00	535500.00	Pagada
27	27	FAC-00027	2026-08-23 11:15:00	800000.00	0.00	152000.00	952000.00	Pagada
28	28	FAC-00028	2026-10-10 12:15:00	90000.00	0.00	17100.00	107100.00	Pagada
29	29	FAC-00029	2026-09-27 13:15:00	90000.00	0.00	17100.00	107100.00	Pagada
30	30	FAC-00030	2026-09-22 14:15:00	240000.00	0.00	45600.00	285600.00	Pagada
31	31	FAC-00031	2026-10-17 15:15:00	90000.00	0.00	17100.00	107100.00	Pagada
32	32	FAC-00032	2026-10-12 16:15:00	90000.00	0.00	17100.00	107100.00	Pagada
33	33	FAC-00033	2026-10-07 09:15:00	450000.00	0.00	85500.00	535500.00	Pagada
34	34	FAC-00034	2026-10-20 10:15:00	90000.00	0.00	17100.00	107100.00	Pendiente
35	35	FAC-00035	2026-10-21 11:15:00	240000.00	0.00	45600.00	285600.00	Pendiente
36	36	FAC-00036	2026-09-23 12:15:00	90000.00	0.00	17100.00	107100.00	Pagada
\.


--
-- Data for Name: membresia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.membresia (id_membresia, nombre, descripcion, precio, duracion_dias, estado) FROM stdin;
1	Pase diario	Acceso por un día a todas las sedes	15000.00	1	Activa
2	Mensual	Acceso ilimitado por 30 días	90000.00	30	Activa
3	Trimestral	Acceso ilimitado por 90 días con 10% de ahorro	240000.00	90	Activa
4	Semestral	Acceso ilimitado por 180 días más valoración física	450000.00	180	Activa
5	Anual	Acceso ilimitado por 365 días, clases incluidas	800000.00	365	Activa
\.


--
-- Data for Name: pago; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pago (id_pago, id_factura, monto, fecha_pago, metodo_pago, estado_pago, referencia_pago, concepto) FROM stdin;
1	1	107100.00	2026-05-05 09:20:00	Efectivo	Aprobado	PAG-00001	Pago Mensual
2	2	107100.00	2026-06-04 10:20:00	Tarjeta	Aprobado	PAG-00002	Pago Mensual
3	3	107100.00	2026-07-04 11:20:00	Transferencia	Aprobado	PAG-00003	Pago Mensual
4	4	285600.00	2026-08-03 12:20:00	PSE	Aprobado	PAG-00004	Pago Trimestral
5	5	107100.00	2026-05-02 13:20:00	Efectivo	Aprobado	PAG-00005	Pago Mensual
6	6	107100.00	2026-06-02 14:20:00	Tarjeta	Aprobado	PAG-00006	Pago Mensual
7	7	107100.00	2026-07-03 15:20:00	Transferencia	Aprobado	PAG-00007	Pago Mensual
8	8	285600.00	2026-08-02 16:20:00	PSE	Aprobado	PAG-00008	Pago Trimestral
9	9	107100.00	2026-04-29 09:20:00	Efectivo	Aprobado	PAG-00009	Pago Mensual
10	10	107100.00	2026-05-31 10:20:00	Tarjeta	Aprobado	PAG-00010	Pago Mensual
11	11	107100.00	2026-07-02 11:20:00	Transferencia	Aprobado	PAG-00011	Pago Mensual
12	12	285600.00	2026-08-01 12:20:00	PSE	Aprobado	PAG-00012	Pago Trimestral
13	13	107100.00	2026-04-26 13:20:00	Efectivo	Aprobado	PAG-00013	Pago Mensual
14	14	107100.00	2026-05-29 14:20:00	Tarjeta	Aprobado	PAG-00014	Pago Mensual
15	15	107100.00	2026-07-01 15:20:00	Transferencia	Aprobado	PAG-00015	Pago Mensual
16	16	285600.00	2026-07-31 16:20:00	PSE	Aprobado	PAG-00016	Pago Trimestral
17	17	107100.00	2026-04-23 09:20:00	Efectivo	Aprobado	PAG-00017	Pago Mensual
18	18	107100.00	2026-05-27 10:20:00	Tarjeta	Aprobado	PAG-00018	Pago Mensual
19	19	107100.00	2026-06-30 11:20:00	Transferencia	Aprobado	PAG-00019	Pago Mensual
20	20	107100.00	2026-04-20 12:20:00	PSE	Aprobado	PAG-00020	Pago Mensual
21	21	107100.00	2026-05-25 13:20:00	Efectivo	Aprobado	PAG-00021	Pago Mensual
22	22	107100.00	2026-06-29 14:20:00	Tarjeta	Aprobado	PAG-00022	Pago Mensual
23	23	107100.00	2026-04-17 15:20:00	Transferencia	Aprobado	PAG-00023	Pago Mensual
24	24	107100.00	2026-04-14 16:20:00	PSE	Aprobado	PAG-00024	Pago Mensual
25	25	285600.00	2026-10-02 09:20:00	Efectivo	Aprobado	PAG-00025	Pago Trimestral
26	26	535500.00	2026-09-07 10:20:00	Tarjeta	Aprobado	PAG-00026	Pago Semestral
27	27	952000.00	2026-08-23 11:20:00	Transferencia	Aprobado	PAG-00027	Pago Anual
28	28	107100.00	2026-10-10 12:20:00	PSE	Aprobado	PAG-00028	Pago Mensual
29	29	107100.00	2026-09-27 13:20:00	Efectivo	Aprobado	PAG-00029	Pago Mensual
30	30	285600.00	2026-09-22 14:20:00	Tarjeta	Aprobado	PAG-00030	Pago Trimestral
31	31	107100.00	2026-10-17 15:20:00	Transferencia	Aprobado	PAG-00031	Pago Mensual
32	32	107100.00	2026-10-12 16:20:00	PSE	Aprobado	PAG-00032	Pago Mensual
33	33	535500.00	2026-10-07 09:20:00	Efectivo	Aprobado	PAG-00033	Pago Semestral
34	36	107100.00	2026-09-23 12:20:00	PSE	Aprobado	PAG-00036	Pago Mensual
\.


--
-- Data for Name: persona; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.persona (id_persona, documento_identidad, nombres, apellidos, fecha_nacimiento, email, telefono, fecha_registro) FROM stdin;
1	1000000001	Marcela	Quintero Vera	2007-08-23	admin@fitmanager.co	3120000000	2025-09-17
2	1000000002	Pedro	Sánchez Ortiz	2006-06-18	recepcion@fitmanager.co	3120000137	2025-09-17
3	1000000003	Carlos	Rojas Peña	2005-04-13	carlosrojas@fitmanager.co	3120000274	2025-09-17
4	1000000004	Laura	Méndez Díaz	2004-02-07	lauramendez@fitmanager.co	3120000411	2025-09-17
5	1000000005	Andrés	Pico Lobo	2002-12-03	andrespico@fitmanager.co	3120000548	2025-09-17
6	1090100001	Dorainy	Guerrero Bayona	2001-09-28	cliente1@fitmanager.co	3120000685	2026-05-15
7	1090100002	Jesús	Zapata Lozano	2000-07-24	cliente2@fitmanager.co	3120000822	2026-05-23
8	1090100003	Johan	Galán Herrera	1999-05-20	cliente3@fitmanager.co	3120000959	2026-05-31
9	1090100004	Valentina	Cárdenas Ruiz	1998-03-15	cliente4@fitmanager.co	3120001096	2026-06-08
10	1090100005	Sebastián	Mora Pacheco	1997-01-08	cliente5@fitmanager.co	3120001233	2026-06-16
11	1090100006	Camila	Arévalo Soto	1995-11-04	cliente6@fitmanager.co	3120001370	2026-06-24
12	1090100007	Daniel	Peñaranda Gil	1994-08-30	cliente7@fitmanager.co	3120001507	2026-07-02
13	1090100008	Isabela	Contreras Mejía	1993-06-25	cliente8@fitmanager.co	3120001644	2026-07-10
14	1090100009	Mateo	Rincón Duarte	1992-04-20	cliente9@fitmanager.co	3120001781	2026-07-18
15	1090100010	Sofía	Lobo Navarro	1991-02-14	cliente10@fitmanager.co	3120001918	2026-07-26
16	1090100011	Tomás	Bayona Quintero	1989-12-10	cliente11@fitmanager.co	3120002055	2026-08-03
17	1090100012	Natalia	Ortiz Castro	1988-10-05	cliente12@fitmanager.co	3120002192	2026-08-11
\.


--
-- Data for Name: programacion_clase; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.programacion_clase (id_programacion, id_clase, id_entrenador, id_sede, fecha_hora_inicio, duracion_minutos) FROM stdin;
1	3	1	1	2026-10-08 07:00:00	60
2	4	2	1	2026-10-08 18:30:00	45
3	5	2	1	2026-10-09 07:00:00	60
4	1	3	2	2026-10-09 18:30:00	45
5	2	3	2	2026-10-10 07:00:00	60
6	3	1	1	2026-10-10 18:30:00	45
7	4	1	1	2026-10-11 07:00:00	60
8	5	2	1	2026-10-11 18:30:00	45
9	1	2	1	2026-10-12 07:00:00	60
10	2	3	2	2026-10-12 18:30:00	45
11	3	3	2	2026-10-13 07:00:00	60
12	4	1	1	2026-10-13 18:30:00	45
13	5	1	1	2026-10-14 07:00:00	60
14	1	2	1	2026-10-14 18:30:00	45
15	2	2	1	2026-10-15 07:00:00	60
16	3	3	2	2026-10-15 18:30:00	45
17	4	3	2	2026-10-16 07:00:00	60
18	5	1	1	2026-10-16 18:30:00	45
19	1	1	1	2026-10-17 07:00:00	60
20	2	2	1	2026-10-17 18:30:00	45
21	3	2	1	2026-10-18 07:00:00	60
22	4	3	2	2026-10-18 18:30:00	45
23	5	3	2	2026-10-19 07:00:00	60
24	1	1	1	2026-10-19 18:30:00	45
25	2	1	1	2026-10-20 07:00:00	60
26	3	2	1	2026-10-20 18:30:00	45
27	4	2	1	2026-10-21 07:00:00	60
28	5	3	2	2026-10-21 18:30:00	45
29	1	3	2	2026-10-22 07:00:00	60
30	2	1	1	2026-10-22 18:30:00	45
31	3	1	1	2026-10-23 07:00:00	60
32	4	2	1	2026-10-23 18:30:00	45
33	5	2	1	2026-10-24 07:00:00	60
34	1	3	2	2026-10-24 18:30:00	45
35	2	3	2	2026-10-25 07:00:00	60
36	3	1	1	2026-10-25 18:30:00	45
37	4	1	1	2026-10-26 07:00:00	60
38	5	2	1	2026-10-26 18:30:00	45
39	1	2	1	2026-10-27 07:00:00	60
40	2	3	2	2026-10-27 18:30:00	45
41	3	3	2	2026-10-28 07:00:00	60
42	4	1	1	2026-10-28 18:30:00	45
43	5	1	1	2026-10-29 07:00:00	60
44	1	2	1	2026-10-29 18:30:00	45
\.


--
-- Data for Name: reserva_clase; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reserva_clase (id_reserva, id_cliente, id_programacion, fecha_reserva, estado_reserva) FROM stdin;
1	14	1	2026-10-07 10:00:00	Asistio
2	8	1	2026-10-07 10:00:00	Asistio
3	6	1	2026-10-07 10:00:00	Asistio
4	10	1	2026-10-07 10:00:00	Asistio
5	10	2	2026-10-07 10:00:00	Cancelada
6	12	2	2026-10-07 10:00:00	Asistio
7	8	3	2026-10-08 10:00:00	Asistio
8	10	3	2026-10-08 10:00:00	Asistio
9	12	3	2026-10-08 10:00:00	Cancelada
10	6	3	2026-10-08 10:00:00	Asistio
11	10	4	2026-10-08 10:00:00	Asistio
12	14	4	2026-10-08 10:00:00	Cancelada
13	6	4	2026-10-08 10:00:00	Asistio
14	8	4	2026-10-08 10:00:00	Asistio
15	6	5	2026-10-09 10:00:00	Cancelada
16	8	5	2026-10-09 10:00:00	Asistio
17	12	5	2026-10-09 10:00:00	Asistio
18	7	5	2026-10-09 10:00:00	Asistio
19	6	6	2026-10-09 10:00:00	Asistio
20	12	6	2026-10-09 10:00:00	Asistio
21	10	6	2026-10-09 10:00:00	Asistio
22	8	6	2026-10-09 10:00:00	Asistio
23	10	7	2026-10-10 10:00:00	Asistio
24	12	7	2026-10-10 10:00:00	Cancelada
25	14	8	2026-10-10 10:00:00	Asistio
26	12	8	2026-10-10 10:00:00	Asistio
27	6	8	2026-10-10 10:00:00	Asistio
28	8	8	2026-10-10 10:00:00	Asistio
29	6	9	2026-10-11 10:00:00	Asistio
30	14	9	2026-10-11 10:00:00	Asistio
31	12	9	2026-10-11 10:00:00	Asistio
32	8	9	2026-10-11 10:00:00	Asistio
33	12	10	2026-10-11 10:00:00	Cancelada
34	8	10	2026-10-11 10:00:00	Asistio
35	6	10	2026-10-11 10:00:00	Asistio
36	14	10	2026-10-11 10:00:00	Cancelada
37	10	11	2026-10-12 10:00:00	Asistio
38	12	11	2026-10-12 10:00:00	Asistio
39	14	11	2026-10-12 10:00:00	Asistio
40	10	12	2026-10-12 10:00:00	Cancelada
41	8	12	2026-10-12 10:00:00	Asistio
42	12	12	2026-10-12 10:00:00	Cancelada
43	6	13	2026-10-13 10:00:00	Cancelada
44	14	13	2026-10-13 10:00:00	Asistio
45	12	13	2026-10-13 10:00:00	Cancelada
46	10	13	2026-10-13 10:00:00	Asistio
47	8	14	2026-10-13 10:00:00	Asistio
48	12	14	2026-10-13 10:00:00	Asistio
49	6	14	2026-10-13 10:00:00	Asistio
50	6	15	2026-10-14 10:00:00	Cancelada
51	14	15	2026-10-14 10:00:00	Cancelada
52	12	15	2026-10-14 10:00:00	Asistio
53	10	16	2026-10-14 10:00:00	Asistio
54	8	16	2026-10-14 10:00:00	Cancelada
55	6	16	2026-10-14 10:00:00	Asistio
56	12	17	2026-10-15 10:00:00	Asistio
57	6	17	2026-10-15 10:00:00	Cancelada
58	10	18	2026-10-15 10:00:00	Asistio
59	14	18	2026-10-15 10:00:00	Asistio
60	8	18	2026-10-15 10:00:00	Cancelada
61	8	19	2026-10-16 10:00:00	Asistio
62	12	19	2026-10-16 10:00:00	Asistio
63	10	19	2026-10-16 10:00:00	Asistio
64	6	20	2026-10-16 10:00:00	Asistio
65	10	20	2026-10-16 10:00:00	Asistio
66	12	21	2026-10-17 10:00:00	Asistio
67	8	21	2026-10-17 10:00:00	Cancelada
68	6	22	2026-10-17 10:00:00	Asistio
69	12	22	2026-10-17 10:00:00	Asistio
70	8	22	2026-10-17 10:00:00	Asistio
71	14	22	2026-10-17 10:00:00	Asistio
72	10	22	2026-10-17 10:00:00	Asistio
73	8	23	2026-10-18 10:00:00	Asistio
74	10	23	2026-10-18 10:00:00	Cancelada
75	12	23	2026-10-18 10:00:00	Asistio
76	6	23	2026-10-18 10:00:00	Asistio
77	13	24	2026-10-18 10:00:00	Cancelada
78	8	24	2026-10-18 10:00:00	Cancelada
79	6	24	2026-10-18 10:00:00	Asistio
80	12	24	2026-10-18 10:00:00	Asistio
81	10	24	2026-10-18 10:00:00	Asistio
82	12	25	2026-10-19 10:00:00	Cancelada
83	6	25	2026-10-19 10:00:00	Asistio
84	10	25	2026-10-19 10:00:00	Asistio
85	12	26	2026-10-19 10:00:00	Asistio
86	14	26	2026-10-19 10:00:00	Asistio
87	6	26	2026-10-19 10:00:00	Asistio
88	8	26	2026-10-19 10:00:00	Asistio
89	14	27	2026-10-20 10:00:00	Asistio
90	8	27	2026-10-20 10:00:00	Asistio
91	14	28	2026-10-20 10:00:00	Asistio
92	12	28	2026-10-20 10:00:00	Asistio
93	10	28	2026-10-20 10:00:00	Asistio
94	14	29	2026-10-21 10:00:00	Asistio
95	12	29	2026-10-21 10:00:00	Asistio
96	6	29	2026-10-21 10:00:00	Cancelada
97	6	30	2026-10-22 05:13:34	Confirmada
98	12	30	2026-10-22 05:13:34	Confirmada
99	14	30	2026-10-22 05:13:34	Confirmada
100	10	30	2026-10-22 21:13:34	Confirmada
101	8	30	2026-10-22 21:13:34	Confirmada
102	6	31	2026-10-22 21:13:34	Confirmada
103	8	31	2026-10-21 13:13:34	Confirmada
104	12	31	2026-10-22 05:13:34	Confirmada
105	12	32	2026-10-22 21:13:34	Confirmada
106	11	32	2026-10-21 13:13:34	Confirmada
107	8	32	2026-10-22 21:13:34	Confirmada
108	10	32	2026-10-21 13:13:34	Confirmada
109	14	32	2026-10-22 05:13:34	Confirmada
110	8	33	2026-10-21 13:13:34	Confirmada
111	6	33	2026-10-22 05:13:34	Confirmada
112	10	33	2026-10-22 05:13:34	Confirmada
113	14	33	2026-10-21 13:13:34	Confirmada
114	12	34	2026-10-22 05:13:34	Confirmada
115	6	34	2026-10-22 12:13:34	Confirmada
116	10	35	2026-10-21 13:13:34	Confirmada
117	6	35	2026-10-22 21:13:34	Confirmada
118	14	35	2026-10-22 05:13:34	Confirmada
119	12	36	2026-10-21 13:13:34	Confirmada
120	14	36	2026-10-22 21:13:34	Confirmada
121	6	36	2026-10-22 21:13:34	Confirmada
122	8	36	2026-10-21 13:13:34	Confirmada
123	8	37	2026-10-21 13:13:34	Confirmada
124	14	37	2026-10-22 21:13:34	Confirmada
125	12	38	2026-10-22 05:13:34	Confirmada
126	14	38	2026-10-22 05:13:34	Confirmada
127	10	38	2026-10-22 05:13:34	Confirmada
128	6	39	2026-10-21 13:13:34	Confirmada
129	12	39	2026-10-21 13:13:34	Confirmada
130	14	39	2026-10-22 05:13:34	Confirmada
131	10	39	2026-10-21 13:13:34	Confirmada
132	12	40	2026-10-22 21:13:34	Confirmada
133	8	40	2026-10-22 05:13:34	Confirmada
134	6	40	2026-10-22 05:13:34	Confirmada
135	14	41	2026-10-22 05:13:34	Confirmada
136	6	41	2026-10-22 05:13:34	Confirmada
137	10	41	2026-10-22 21:13:34	Confirmada
138	9	41	2026-10-22 05:13:34	Confirmada
139	8	42	2026-10-22 05:13:34	Confirmada
140	10	42	2026-10-22 05:13:34	Confirmada
141	12	42	2026-10-21 13:13:34	Confirmada
142	6	42	2026-10-21 13:13:34	Confirmada
143	14	43	2026-10-21 13:13:34	Confirmada
144	8	43	2026-10-21 13:13:34	Confirmada
145	11	43	2026-10-21 13:13:34	Confirmada
146	6	43	2026-10-22 05:13:34	Confirmada
147	10	43	2026-10-22 05:13:34	Confirmada
148	6	44	2026-10-22 05:13:34	Confirmada
149	14	44	2026-10-21 13:13:34	Confirmada
150	10	44	2026-10-22 05:13:34	Confirmada
\.


--
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rol (id_rol, nombre, descripcion) FROM stdin;
1	Administrador	Acceso total al sistema
2	Recepcionista	Gestiona clientes, suscripciones, pagos y accesos
3	Entrenador	Gestiona rutinas, clases y ejercicios
4	Cliente	Afiliado del gimnasio: reserva clases y consulta sus rutinas
\.


--
-- Data for Name: rutina; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rutina (id_rutina, id_cliente, id_entrenador, nombre_rutina, objetivo, fecha_asignacion) FROM stdin;
1	6	1	Hipertrofia tren superior	Ganar masa muscular	2026-10-17
2	7	1	Fuerza base	Aumentar fuerza máxima	2026-10-11
3	8	3	Funcional full body	Acondicionamiento general	2026-10-05
4	9	2	Tonificación y core	Tonificar y mejorar postura	2026-09-29
5	10	3	Pérdida de grasa	Reducir porcentaje graso	2026-09-23
6	11	1	Piernas y glúteos	Desarrollo de tren inferior	2026-09-17
\.


--
-- Data for Name: sede; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sede (id_sede, nombre, direccion, telefono, estado) FROM stdin;
1	FitManager Centro	Calle 11 # 12-45, Ocaña	3001112233	Activa
2	FitManager Norte	Carrera 27 # 5-80, Ocaña	3004445566	Activa
\.


--
-- Data for Name: suscripcion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suscripcion (id_suscripcion, id_cliente, id_membresia, fecha_inicio, fecha_fin, estado) FROM stdin;
1	6	2	2026-05-05	2026-06-04	Vencida
2	6	2	2026-06-04	2026-07-04	Vencida
3	6	2	2026-07-04	2026-08-03	Vencida
4	6	3	2026-08-03	2026-11-01	Activa
5	7	2	2026-05-02	2026-06-01	Vencida
6	7	2	2026-06-02	2026-07-02	Vencida
7	7	2	2026-07-03	2026-08-02	Vencida
8	7	3	2026-08-02	2026-10-31	Activa
9	8	2	2026-04-29	2026-05-29	Vencida
10	8	2	2026-05-31	2026-06-30	Vencida
11	8	2	2026-07-02	2026-08-01	Vencida
12	8	3	2026-08-01	2026-10-30	Activa
13	9	2	2026-04-26	2026-05-26	Vencida
14	9	2	2026-05-29	2026-06-28	Vencida
15	9	2	2026-07-01	2026-07-31	Vencida
16	9	3	2026-07-31	2026-10-29	Activa
17	10	2	2026-04-23	2026-05-23	Vencida
18	10	2	2026-05-27	2026-06-26	Vencida
19	10	2	2026-06-30	2026-07-30	Vencida
20	11	2	2026-04-20	2026-05-20	Vencida
21	11	2	2026-05-25	2026-06-24	Vencida
22	11	2	2026-06-29	2026-07-29	Vencida
23	12	2	2026-04-17	2026-05-17	Vencida
24	13	2	2026-04-14	2026-05-14	Vencida
25	6	3	2026-10-02	2026-12-31	Activa
26	7	4	2026-09-07	2027-03-06	Activa
27	8	5	2026-08-23	2027-08-23	Activa
28	9	2	2026-10-10	2026-11-09	Activa
29	10	2	2026-09-27	2026-10-27	Activa
30	11	3	2026-09-22	2026-12-21	Activa
31	12	2	2026-10-17	2026-11-16	Activa
32	13	2	2026-10-12	2026-11-11	Activa
33	14	4	2026-10-07	2027-04-05	Activa
34	15	2	2026-10-20	2026-11-19	Pendiente
35	16	3	2026-10-21	2027-01-19	Pendiente
36	17	2	2026-09-23	2026-10-23	Activa
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuario (id_usuario, id_persona, id_rol, username, password_hash, fecha_creacion) FROM stdin;
1	1	1	admin	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
2	2	2	recepcion	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
3	3	3	carlos.rojas	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
4	4	3	laura.mendez	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
5	5	3	andres.pico	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
6	6	4	cliente1	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
7	7	4	cliente2	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
8	8	4	cliente3	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
9	9	4	cliente4	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
10	10	4	cliente5	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
11	11	4	cliente6	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
12	12	4	cliente7	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
13	13	4	cliente8	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
14	14	4	cliente9	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
15	15	4	cliente10	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
16	16	4	cliente11	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
17	17	4	cliente12	$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm	2026-10-22 22:13:34
\.


--
-- Name: clase_id_clase_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clase_id_clase_seq', 5, true);


--
-- Name: control_acceso_id_acceso_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.control_acceso_id_acceso_seq', 145, true);


--
-- Name: detalle_rutina_id_detalle_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detalle_rutina_id_detalle_seq', 30, true);


--
-- Name: ejercicio_id_ejercicio_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ejercicio_id_ejercicio_seq', 12, true);


--
-- Name: entrenador_id_entrenador_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.entrenador_id_entrenador_seq', 3, true);


--
-- Name: factura_id_factura_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.factura_id_factura_seq', 36, true);


--
-- Name: membresia_id_membresia_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.membresia_id_membresia_seq', 5, true);


--
-- Name: pago_id_pago_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pago_id_pago_seq', 34, true);


--
-- Name: persona_id_persona_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.persona_id_persona_seq', 17, true);


--
-- Name: programacion_clase_id_programacion_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.programacion_clase_id_programacion_seq', 44, true);


--
-- Name: reserva_clase_id_reserva_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reserva_clase_id_reserva_seq', 150, true);


--
-- Name: rol_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rol_id_rol_seq', 4, true);


--
-- Name: rutina_id_rutina_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rutina_id_rutina_seq', 6, true);


--
-- Name: sede_id_sede_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sede_id_sede_seq', 2, true);


--
-- Name: suscripcion_id_suscripcion_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suscripcion_id_suscripcion_seq', 36, true);


--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuario_id_usuario_seq', 17, true);


--
-- Name: clase clase_nombre_clase_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clase
    ADD CONSTRAINT clase_nombre_clase_key UNIQUE (nombre_clase);


--
-- Name: clase clase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clase
    ADD CONSTRAINT clase_pkey PRIMARY KEY (id_clase);


--
-- Name: control_acceso control_acceso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_acceso
    ADD CONSTRAINT control_acceso_pkey PRIMARY KEY (id_acceso);


--
-- Name: detalle_rutina detalle_rutina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_rutina
    ADD CONSTRAINT detalle_rutina_pkey PRIMARY KEY (id_detalle);


--
-- Name: ejercicio ejercicio_nombre_ejercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejercicio
    ADD CONSTRAINT ejercicio_nombre_ejercicio_key UNIQUE (nombre_ejercicio);


--
-- Name: ejercicio ejercicio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejercicio
    ADD CONSTRAINT ejercicio_pkey PRIMARY KEY (id_ejercicio);


--
-- Name: entrenador entrenador_id_persona_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrenador
    ADD CONSTRAINT entrenador_id_persona_key UNIQUE (id_persona);


--
-- Name: entrenador entrenador_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrenador
    ADD CONSTRAINT entrenador_pkey PRIMARY KEY (id_entrenador);


--
-- Name: factura factura_numero_factura_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_numero_factura_key UNIQUE (numero_factura);


--
-- Name: factura factura_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_pkey PRIMARY KEY (id_factura);


--
-- Name: membresia membresia_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia
    ADD CONSTRAINT membresia_nombre_key UNIQUE (nombre);


--
-- Name: membresia membresia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia
    ADD CONSTRAINT membresia_pkey PRIMARY KEY (id_membresia);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (id_pago);


--
-- Name: pago pago_referencia_pago_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_referencia_pago_key UNIQUE (referencia_pago);


--
-- Name: persona persona_documento_identidad_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona
    ADD CONSTRAINT persona_documento_identidad_key UNIQUE (documento_identidad);


--
-- Name: persona persona_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona
    ADD CONSTRAINT persona_pkey PRIMARY KEY (id_persona);


--
-- Name: programacion_clase programacion_clase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacion_clase
    ADD CONSTRAINT programacion_clase_pkey PRIMARY KEY (id_programacion);


--
-- Name: reserva_clase reserva_clase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_clase
    ADD CONSTRAINT reserva_clase_pkey PRIMARY KEY (id_reserva);


--
-- Name: rol rol_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_nombre_key UNIQUE (nombre);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (id_rol);


--
-- Name: rutina rutina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rutina
    ADD CONSTRAINT rutina_pkey PRIMARY KEY (id_rutina);


--
-- Name: sede sede_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sede
    ADD CONSTRAINT sede_pkey PRIMARY KEY (id_sede);


--
-- Name: suscripcion suscripcion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suscripcion
    ADD CONSTRAINT suscripcion_pkey PRIMARY KEY (id_suscripcion);


--
-- Name: reserva_clase uq_reserva; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_clase
    ADD CONSTRAINT uq_reserva UNIQUE (id_cliente, id_programacion);


--
-- Name: usuario usuario_id_persona_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_id_persona_key UNIQUE (id_persona);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);


--
-- Name: usuario usuario_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_username_key UNIQUE (username);


--
-- Name: idx_acceso_ingreso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acceso_ingreso ON public.control_acceso USING btree (fecha_hora_ingreso);


--
-- Name: idx_suscripcion_cliente_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suscripcion_cliente_estado ON public.suscripcion USING btree (id_cliente, estado);


--
-- Name: control_acceso fk_acceso_cliente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_acceso
    ADD CONSTRAINT fk_acceso_cliente FOREIGN KEY (id_cliente) REFERENCES public.persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: control_acceso fk_acceso_sede; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_acceso
    ADD CONSTRAINT fk_acceso_sede FOREIGN KEY (id_sede) REFERENCES public.sede(id_sede) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalle_rutina fk_detalle_ejercicio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_rutina
    ADD CONSTRAINT fk_detalle_ejercicio FOREIGN KEY (id_ejercicio) REFERENCES public.ejercicio(id_ejercicio) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalle_rutina fk_detalle_rutina; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_rutina
    ADD CONSTRAINT fk_detalle_rutina FOREIGN KEY (id_rutina) REFERENCES public.rutina(id_rutina) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: entrenador fk_entrenador_persona; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrenador
    ADD CONSTRAINT fk_entrenador_persona FOREIGN KEY (id_persona) REFERENCES public.persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: entrenador fk_entrenador_sede; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entrenador
    ADD CONSTRAINT fk_entrenador_sede FOREIGN KEY (id_sede) REFERENCES public.sede(id_sede) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: factura fk_factura_suscripcion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT fk_factura_suscripcion FOREIGN KEY (id_suscripcion) REFERENCES public.suscripcion(id_suscripcion) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pago fk_pago_factura; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT fk_pago_factura FOREIGN KEY (id_factura) REFERENCES public.factura(id_factura) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: programacion_clase fk_prog_clase; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacion_clase
    ADD CONSTRAINT fk_prog_clase FOREIGN KEY (id_clase) REFERENCES public.clase(id_clase) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: programacion_clase fk_prog_entrenador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacion_clase
    ADD CONSTRAINT fk_prog_entrenador FOREIGN KEY (id_entrenador) REFERENCES public.entrenador(id_entrenador) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: programacion_clase fk_prog_sede; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programacion_clase
    ADD CONSTRAINT fk_prog_sede FOREIGN KEY (id_sede) REFERENCES public.sede(id_sede) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reserva_clase fk_reserva_cliente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_clase
    ADD CONSTRAINT fk_reserva_cliente FOREIGN KEY (id_cliente) REFERENCES public.persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reserva_clase fk_reserva_prog; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_clase
    ADD CONSTRAINT fk_reserva_prog FOREIGN KEY (id_programacion) REFERENCES public.programacion_clase(id_programacion) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rutina fk_rutina_cliente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rutina
    ADD CONSTRAINT fk_rutina_cliente FOREIGN KEY (id_cliente) REFERENCES public.persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rutina fk_rutina_entrenador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rutina
    ADD CONSTRAINT fk_rutina_entrenador FOREIGN KEY (id_entrenador) REFERENCES public.entrenador(id_entrenador) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: suscripcion fk_suscripcion_cliente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suscripcion
    ADD CONSTRAINT fk_suscripcion_cliente FOREIGN KEY (id_cliente) REFERENCES public.persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: suscripcion fk_suscripcion_membresia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suscripcion
    ADD CONSTRAINT fk_suscripcion_membresia FOREIGN KEY (id_membresia) REFERENCES public.membresia(id_membresia) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: usuario fk_usuario_persona; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT fk_usuario_persona FOREIGN KEY (id_persona) REFERENCES public.persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: usuario fk_usuario_rol; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES public.rol(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


