---
title: "Arquitetura de frontend: organizando o CAOS"
date: 2026-10-05
excerpt: "E se tratássemos o frontend como tratamos o backend? Uma proposta de arquitetura modular por domínio, usando um e-commerce como exemplo."
tags: ["frontend", "arquitetura"]
cover: ./images/arquitetura-frontend-ecommerce.png
coverAlt: "Frontend como software — arquitetura modular por domínio em um e-commerce, com as camadas domain, application, infrastructure e ui."
---

O primeiro ponto de partida de todo desenvolvedor costuma ser o frontend.

A primeira coisa que a gente faz é um HTML e CSS.

Passei muitos anos trabalhando com frontend. Trabalhei com PHP, jQuery, JavaScript, Java, React e vi bastante coisa.

Sempre gostei muito de frontend, principalmente de design.

Mas depois de alguns anos comecei a ficar incomodado com a forma como algumas aplicações frontend eram construídas.

Falta de padrão, falta de organização, responsabilidades misturadas e, principalmente, uma dificuldade enorme de entender onde determinada regra deveria estar.

Então preferi fugir um pouco e me voltar para o backend.

Comecei a entender melhor algumas coisas como DDD, TDD, DI, arquitetura em camadas, separação de responsabilidades e outras coisas que normalmente associamos ao backend.

Depois de entender um pouco mais sobre isso, comecei a olhar para o frontend com uma nova perspectiva.

Hoje em dia o frontend é tão complexo quanto qualquer outra parte de uma aplicação.

Tem regras de negócio, estado, integrações, autenticação, autorização, cache, validações, workflows e uma quantidade enorme de lógica.

Talvez seja justamente por isso que algumas aplicações frontend sejam tão difíceis de manter.

E comecei a pensar:

> **E se tratássemos o frontend como tratamos o backend?**

Recentemente, desenvolvendo uma aplicação do zero, tive a oportunidade de experimentar isso.

O padrão ainda está sendo testado e validado, mas consegui chegar em uma arquitetura que gostei bastante.

A ideia é relativamente simples:

**desacoplar responsabilidades, mover as dependências para os lugares certos e organizar o código a partir do domínio da aplicação.**

Para explicar a ideia, vou usar um exemplo mais simples que o projeto onde apliquei isso: um e-commerce.

## 1. Modularizar por domínio

A primeira decisão é modularizar.

Em vez de organizar a aplicação pensando primeiro nas páginas, penso nas partes do negócio.

Um e-commerce poderia ter:

```text
catalog/
cart/
checkout/
order/
customer/
payment/
authentication/
shared/
```

Cada um desses módulos representa uma parte do domínio.

São os nossos bounded contexts.

Por exemplo:

```text
catalog/
├── domain/
├── application/
├── infrastructure/
└── ui/
```

E:

```text
cart/
├── domain/
├── application/
├── infrastructure/
└── ui/
```

A ideia é que cada módulo seja responsável por uma parte específica da aplicação.

Não quero uma aplicação onde exista uma pasta global com todos os `services`, outra com todos os `repositories` e outra com todos os `components`.

Quero conseguir olhar para `cart/` e encontrar ali o que pertence ao carrinho.

## 2. Por que não organizar por página?

Essa é uma dúvida que pode aparecer rapidamente.

Por que não fazer:

```text
pages/
├── products/
├── cart/
├── checkout/
└── orders/
```

Porque página é uma decisão de apresentação.

O domínio é outra coisa.

Hoje posso ter uma página de produto.

Amanhã posso apresentar o mesmo produto em:

```text
lista de produtos
página de detalhes
busca
recomendação
mobile
admin
```

O produto continua sendo o mesmo.

Por isso prefiro que a estrutura principal da aplicação acompanhe o domínio e não a estrutura atual da interface.

A página pode mudar.

O domínio continua existindo.

## 3. Domain

Dentro de cada módulo existe o `domain`.

É aqui que ficam as entidades e as regras de negócio.

Um `Product`, por exemplo, não deveria ser apenas um objeto com propriedades.

Ele pode possuir comportamentos:

```ts
product.isAvailable()
product.hasDiscount()
product.finalPrice()
product.hasVariant()
```

Um `Cart` também possui regras:

```ts
cart.addProduct()
cart.removeProduct()
cart.changeQuantity()
cart.total()
```

Imagine que o usuário tente adicionar 20 unidades de um produto que possui apenas 5 em estoque.

Essa regra não deveria estar dentro do componente React.

Não deveria estar em um `onClick`.

Não deveria depender de uma chamada HTTP.

O `Cart` deveria saber que essa operação é inválida.

A ideia é:

> **A entidade deve possuir as regras que pertencem a ela.**

Isso também deixa o domínio independente da interface.

O `Cart` não sabe que existe um botão "Adicionar".

Ele sabe apenas que existe uma operação para adicionar um produto.

## 4. Domain não é uma pasta de utilidades

Também existe uma diferença importante.

Não quero colocar qualquer transformação dentro do domínio.

Existe uma diferença entre:

> "Um pedido não pode ser criado sem produtos."

e:

> "O preço deve aparecer com duas casas decimais."

A primeira é uma regra de negócio.

A segunda é uma decisão de apresentação.

Minha regra é:

> **O domínio decide o significado. A interface decide como apresentar esse significado.**

Isso evita transformar o `domain` em uma pasta gigante de `utils`.

## 5. Application

Se o domínio contém as regras, a camada `application` contém os casos de uso.

É aqui que descrevo o que a aplicação faz.

Em um e-commerce:

```text
catalog/
    SearchProducts
    GetProduct

cart/
    AddProductToCart
    RemoveProductFromCart
    ChangeCartQuantity

checkout/
    CalculateCheckout
    ApplyCoupon
    ChooseShipping
    Checkout

order/
    CreateOrder
    CancelOrder
    GetOrder

payment/
    ProcessPayment
```

Um caso de uso coordena as diferentes partes.

Por exemplo:

```text
AddProductToCart
        ↓
     Product
        ↓
       Cart
        ↓
 CartRepository
```

Ele pode buscar o produto, entregar esse produto para o carrinho, deixar o domínio validar a operação e depois persistir o resultado.

O caso de uso conhece o **fluxo**.

O domínio conhece as **regras**.

## 6. Infrastructure

A infraestrutura é onde a aplicação conversa com o mundo externo.

HTTP.

GraphQL.

gRPC.

APIs externas.

Storage.

Serviços de pagamento.

Tudo aquilo que depende de uma tecnologia ou sistema externo.

Por exemplo:

```text
payment/
└── infrastructure/
    └── StripePaymentGateway
```

Mas o domínio não precisa conhecer Stripe.

Posso definir uma abstração:

```ts
interface PaymentGateway {
  pay(payment: Payment): Promise<PaymentResult>
}
```

E depois ter:

```text
StripePaymentGateway
FakePaymentGateway
```

O caso de uso trabalha com a abstração.

A infraestrutura fornece a implementação.

Isso permite trocar a tecnologia sem espalhar essa dependência pela aplicação.

## 7. Ponto de entrada da aplicação

Outra decisão que gosto bastante é ter um ponto de entrada para cada tela.

Esse ponto de entrada é responsável por iniciar o fluxo da aplicação.

Ele recebe os parâmetros necessários, chama os casos de uso e, depois que os dados estão preparados, entrega para o componente de apresentação exatamente o que ele precisa.

Por exemplo:

```tsx
export default function ProductPage({ id }) {
  const [product, setProduct] = useState(null)

  useEffect(() => {
    getProduct.execute(id).then(setProduct)
  }, [id])

  if (!product) {
    return <Loading />
  }

  return (
    <ProductPageComponent
      product={product}
    />
  )
}
```

O ponto importante não é o número de linhas.

É a responsabilidade.

Ele não precisa saber como o produto é buscado.

Não precisa saber qual API é utilizada.

Não precisa saber como a entidade é construída.

Ele apenas inicia o fluxo e entrega o resultado para a apresentação.

Podemos pensar assim:

```text
Ponto de entrada
      ↓
   Use Case
      ↓
    Domain
      ↓
  Repository
      ↓
     Dados
      ↓
Componente de apresentação
```

## 8. O componente recebe o que precisa

Gosto também de uma regra simples:

> **O componente deve receber aquilo que precisa, e não a aplicação inteira.**

Por exemplo:

```tsx
<ProductCard
  product={product}
  onAddToCart={addToCart}
/>
```

Em vez de:

```tsx
<ProductCard
  api={api}
  repositories={repositories}
  services={services}
  config={config}
/>
```

O componente não precisa saber de onde veio o produto.

Não precisa conhecer o repository.

Não precisa conhecer HTTP.

Ele recebe uma informação e apresenta essa informação.

Isso reduz bastante o acoplamento.

## 9. Nem todo estado é igual

Outra coisa que comecei a separar melhor foi o estado.

É muito fácil colocar tudo em um único lugar:

```text
user
product
cart
modal
filters
loading
selectedProduct
```

Mas essas coisas possuem naturezas diferentes.

Um produto vindo do servidor não é a mesma coisa que um modal aberto.

Um pedido não é a mesma coisa que a aba selecionada.

Por isso separo os tipos de estado.

### Estado da aplicação

Dados que pertencem ao sistema:

```text
products
orders
customers
inventory
shipping options
```

São dados que precisam ser buscados, armazenados, atualizados e sincronizados.

### Estado da interface

Dados que existem por causa da interação:

```text
modal aberto
menu aberto
filtro selecionado
imagem selecionada
aba selecionada
```

Esses estados normalmente devem ficar próximos de quem os utiliza.

A regra é:

> **O estado deve viver o mais perto possível de quem é responsável por ele.**

Não preciso transformar cada pequeno estado de interface em um estado global.

## 10. Dependency Injection

Outra decisão importante é como essas partes se conectam.

Não quero que um caso de uso crie suas próprias dependências.

Por exemplo, não quero:

```ts
class AddProductToCart {
  private repository = new ProductApiRepository()
}
```

Prefiro:

```ts
class AddProductToCart {
  constructor(
    private productRepository: ProductRepository,
    private cartRepository: CartRepository
  ) {}
}
```

E a aplicação monta essas dependências em um ponto de composição.

Isso deixa explícito do que cada parte depende.

E também facilita os testes.

Posso passar `ProductApiRepository` na aplicação real.

E `FakeProductRepository` durante o teste.

Não preciso de um container para isso.

## 11. Testes

Essa arquitetura também muda a maneira de testar.

Posso testar o domínio sem interface.

```text
Cart
 ↓
Vitest
```

Posso testar um caso de uso sem API.

```text
AddProductToCart
      ↓
FakeRepository
      ↓
Vitest
```

E posso testar a apresentação separadamente:

```text
ProductPageComponent
        ↓
   fake Product
        ↓
       UI
```

O teste deixa de precisar levantar a aplicação inteira para validar uma regra simples.

Cada parte pode ser testada dentro do seu próprio contexto.

## 12. Um fluxo completo

Agora podemos juntar tudo.

Imagine que o usuário está vendo um produto e clica em **"Adicionar ao carrinho"**.

O fluxo seria aproximadamente:

```text
ProductCard
      ↓
AddProductToCart
      ↓
ProductRepository
      ↓
Product
      ↓
Cart
      ↓
CartRepository
      ↓
UI
```

O `ProductCard` sabe que o usuário clicou.

O `AddProductToCart` coordena a operação.

O `Product` e o `Cart` aplicam as regras.

O `Repository` persiste.

E a UI apresenta o novo estado.

Nenhuma dessas partes precisa assumir a responsabilidade da outra.

## 13. O checkout

O checkout mostra ainda melhor por que essa separação é útil.

Podemos ter:

```text
Checkout
   ↓
ValidateCart
   ↓
CalculateShipping
   ↓
ApplyDiscount
   ↓
CreateOrder
   ↓
ProcessPayment
   ↓
ConfirmOrder
```

Cada operação pode possuir seu próprio caso de uso.

E o domínio pode garantir regras como:

```text
Order
 ├── não pode ser criada sem itens
 ├── precisa possuir endereço
 ├── total precisa ser maior que zero
 ├── desconto não pode ultrapassar determinado limite
 └── status segue uma sequência válida
```

A interface não precisa conhecer essas regras.

Ela apenas apresenta o resultado e permite que o usuário interaja com o sistema.

## 14. O que eu não estou tentando fazer

Não quero transformar o frontend em um backend dentro do browser.

Também não quero criar abstrações apenas porque elas parecem arquiteturalmente bonitas.

Não preciso de um framework para cada problema.

Não preciso de um store global para todo estado.

Não preciso de um container de DI se a composição manual resolve.

Não preciso criar uma camada só porque uma arquitetura diz que ela deveria existir.

A pergunta que tento fazer é:

> **Qual problema essa abstração está resolvendo?**

Se não existe um problema claro, provavelmente ela não precisa existir.

## 15. A arquitetura não é sobre tecnologia

Talvez essa seja a parte mais importante.

Essa arquitetura não depende de React.

Não depende de uma biblioteca específica de gerenciamento de estado.

Não depende de HTTP.

Não depende de REST.

Não depende de GraphQL.

As tecnologias podem mudar.

O princípio continua:

```text
                    UI
                     ↓
              Ponto de entrada
                     ↓
               Application
                Use Cases
                     ↓
                  Domain
                     ↓
              Infrastructure
                     ↓
             Mundo externo
```

O objetivo é criar fronteiras.

O domínio não precisa conhecer a infraestrutura.

A infraestrutura não precisa conhecer a interface.

A UI não precisa conhecer as regras internas da aplicação.

E cada parte possui uma responsabilidade clara.

## 16. Ainda estou validando

Não considero isso uma arquitetura definitiva.

Ela ainda está sendo usada, testada e modificada.

Algumas decisões provavelmente vão mudar.

E isso faz parte.

O objetivo não é construir uma arquitetura bonita no papel.

É descobrir se essa separação realmente torna o frontend:

- mais fácil de testar;
- mais fácil de entender;
- mais fácil de modificar;
- menos acoplado à interface;
- menos dependente de infraestrutura;
- mais previsível conforme cresce.

Durante muito tempo eu pensei que arquitetura era principalmente uma preocupação de backend.

Hoje penso diferente.

**Frontend também é software.**

E quanto mais complexo o produto fica, menos sentido faz tratá-lo apenas como uma camada visual.

Talvez a pergunta não seja:

> "Qual framework devo usar no frontend?"

Mas:

> **"Como quero que esse software continue sendo compreensível daqui a dois anos?"**
