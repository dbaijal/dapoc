# End-User Content Rendering Flow — DA + EDS Solution Design

**Document Version:** 1.0
**Status:** Draft
**Date:** 2026-05-27
**Author:** Adobe Delivery Team

---

## Overview

This section describes how published content is delivered to end users for the TFS Edge Delivery Services implementation, with Akamai as the customer-facing CDN and DA.live / Author Bus as the authored content source.

---

## 1. End-User Request Initiation

An end user navigates to a TFS website URL. The browser sends the request to the public site domain, which is fronted by Akamai CDN. Akamai acts as the first caching and delivery layer for TFS public web traffic.

## 2. Akamai Cache Evaluation

Akamai evaluates whether the requested HTML response is already available in its edge cache.

**Cache hit:** Akamai returns the cached response directly to the browser, minimizing latency and reducing origin traffic.

**Cache miss, expired entry, or invalidated entry:** Akamai forwards the request to the downstream Adobe Edge Delivery origin chain for response generation or cache retrieval.

This caching layer helps absorb the majority of repeat traffic close to the end user while preserving fast time-to-first-byte for published pages.

## 3. Edge Delivery Request Resolution

The request is received by Adobe Edge Delivery Services, which evaluates the incoming host, path, and request metadata against the TFS site configuration.

Using this configuration, Edge Delivery Services:

- Identifies the correct TFS site or regional variant
- Resolves the requested page path
- Applies the appropriate routing and delivery rules for the site

This enables multiple sites, locales, or regional variants to be served through a unified Edge Delivery architecture while preserving site-specific behaviour.

## 4. Response Assembly

Edge Delivery Services assembles the HTML response using:

- The published semantic content sourced from DA.live / Author Bus
- The TFS EDS codebase, including blocks, CSS, JavaScript, and site configuration

The runtime returns semantic, edge-optimized HTML for the requested page, along with the appropriate references to stylesheets, scripts, images, and other assets required by the experience.

## 5. Published Content Retrieval and Refresh

Published content is delivered by Edge Delivery Services from its delivery layer and associated caches. When newly published content becomes available, or when cached content has been invalidated, Edge Delivery Services retrieves the latest published content from DA.live / Author Bus and serves the updated response.

This process is transparent to the end user and ensures that published authoring changes are reflected in delivery without exposing the authoring systems directly to public traffic.

## 6. Downstream Caching

Once the response is generated, it is cached through the Adobe-managed delivery layers according to Edge Delivery Services caching behaviour and response headers. The response is then returned to Akamai, which applies its own cache policies for the public domain.

This layered caching strategy improves performance, scalability, and resilience while allowing content changes to propagate quickly through targeted invalidation.

## 7. Final Delivery to the Browser

Akamai returns the HTML response to the end user's browser. The browser then requests referenced assets such as JavaScript, CSS, images, and fonts, which are also served through the configured CDN and Edge Delivery delivery path.

Subsequent requests for the same page are typically served from Akamai cache until the entry expires or is invalidated following a content update.
