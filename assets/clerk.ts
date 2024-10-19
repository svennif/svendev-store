/**
 * We've added Clerk.io API types to the DefinitelyTyped repo, since we use TypeScript
 * @link https://www.npmjs.com/package/@types/clerk.io 
 */

import type { ClerkEndpointsProducts, ClerkProductAttributes } from 'clerk.io';

import { Component } from '@grafikr/components';

import clear from 'utils/clear';
import stringToNode from 'utils/string-to-node';

export default Component((node) => {
  const { config: clerkConfig, endpoint, sectionId } = node.dataset;
  const config = JSON.parse(clerkConfig);

  const output = node.querySelector<HTMLElement>('[data-output]');
  const { classlist } = output.dataset;

  const fetchResponse = async () => {
    try {
      const response = await window.Clerk('call', endpoint as ClerkEndpointsProducts, {
        attributes: ['id', 'handle'],
        ...config,
      });

      if (response.status !== 'ok') {
        throw new Error(
          `Could not fetch Clerk by endpoint: "${endpoint}". Server responded with: ${response.status}`,
        );
      }

      return response;
    } catch (error) {
      node.remove();

      throw error;
    }
  };

  const fetchProduct = async ({ handle, id }: ClerkProductAttributes) => {
    const result = await fetch(`/products/${handle}?view=item`);
    const html = await result.text();

    const element = stringToNode(html);
    element.setAttribute('data-clerk-product-id', id.toString());

    return element.outerHTML;
  };

  const getProducts = (products: ClerkProductAttributes[]) => {
    const promises: Array<Promise<string>> = [];

    products.forEach((product) => {
      promises.push(fetchProduct(product));
    });

    return Promise.all(promises);
  };

  const initClerk = async () => {
    if (!window.Clerk) {
      return;
    }

    try {
      const { product_data: products, result } = await fetchResponse();

      if (result.length === 0) {
        node.remove();
      }

      const productsHTML = await getProducts(products);

      clear(output);

      productsHTML.forEach((product) => {
        output.insertAdjacentHTML(
          `beforeend`,
          String.raw`
            <div class="${classlist}">
              ${product}
            </div>
          `,
        );
      });

      window.Clerk('click', '*[data-clerk-product-id]');
    } catch (error) {
      node.remove();
    }
  };

  initClerk()
});