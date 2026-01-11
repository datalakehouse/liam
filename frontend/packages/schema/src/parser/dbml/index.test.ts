import { describe, expect, it } from 'vitest'
import { processor } from './index.js'

describe(processor, () => {
  describe('should parse DBML schema correctly', () => {
    it('basic table with columns', async () => {
      const dbml = `
        Table users {
          id integer [not null]
          username varchar
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']).toBeDefined()
      expect(value.tables['users']?.columns['id']).toBeDefined()
      expect(value.tables['users']?.columns['username']).toBeDefined()
    })

    it('not null column', async () => {
      const dbml = `
        Table users {
          id integer [not null]
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.columns['id']?.notNull).toBe(true)
    })

    it('nullable column', async () => {
      const dbml = `
        Table users {
          id integer
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.columns['id']?.notNull).toBe(false)
    })

    it('primary key column', async () => {
      const dbml = `
        Table users {
          id integer [pk]
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.constraints['users_pkey']).toEqual({
        type: 'PRIMARY KEY',
        name: 'users_pkey',
        columnNames: ['id'],
      })
    })

    it('unique column', async () => {
      const dbml = `
        Table users {
          id integer [pk]
          email varchar [unique]
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.constraints['users_email_unique']).toEqual({
        type: 'UNIQUE',
        name: 'users_email_unique',
        columnNames: ['email'],
      })
    })

    it('default value as string', async () => {
      const dbml = `
        Table users {
          id integer [pk]
          status varchar [default: 'active']
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.columns['status']?.default).toBe('active')
    })

    it('default value as integer', async () => {
      const dbml = `
        Table users {
          id integer [pk]
          age integer [default: 18]
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.columns['age']?.default).toBe(18)
    })

    it('default value as boolean', async () => {
      const dbml = `
        Table users {
          id integer [pk]
          active boolean [default: true]
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.columns['active']?.default).toBe(true)
    })

    it('table note/comment', async () => {
      const dbml = `
        Table users {
          id integer [pk]
          Note: 'Stores user data'
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.comment).toBe('Stores user data')
    })

    it('column note/comment', async () => {
      const dbml = `
        Table users {
          id integer [pk, note: 'Primary key']
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.columns['id']?.comment).toBe('Primary key')
    })

    it('column type with args', async () => {
      const dbml = `
        Table users {
          id integer [pk]
          username varchar(255)
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.columns['username']?.type).toBe(
        'varchar(255)',
      )
    })
  })

  describe('indexes', () => {
    it('single column index', async () => {
      const dbml = `
        Table users {
          id integer [pk]
          email varchar
          
          indexes {
            email [name: 'idx_users_email']
          }
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.indexes['idx_users_email']).toBeDefined()
      expect(
        value.tables['users']?.indexes['idx_users_email']?.columns,
      ).toContain('email')
    })

    it('composite index', async () => {
      const dbml = `
        Table users {
          id integer [pk]
          first_name varchar
          last_name varchar
          
          indexes {
            (first_name, last_name) [name: 'idx_users_name']
          }
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.tables['users']?.indexes['idx_users_name']).toBeDefined()
      expect(value.tables['users']?.indexes['idx_users_name']?.columns).toEqual(
        ['first_name', 'last_name'],
      )
    })

    it('unique index', async () => {
      const dbml = `
        Table users {
          id integer [pk]
          email varchar
          
          indexes {
            email [unique, name: 'idx_users_email_unique']
          }
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(
        value.tables['users']?.indexes['idx_users_email_unique']?.unique,
      ).toBe(true)
    })
  })

  describe('relationships / foreign keys', () => {
    it('many-to-one relationship', async () => {
      const dbml = `
        Table users {
          id integer [pk]
        }
        
        Table posts {
          id integer [pk]
          user_id integer
        }
        
        Ref: posts.user_id > users.id
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)

      const postsConstraints = value.tables['posts']?.constraints
      const fkConstraint = Object.values(postsConstraints || {}).find(
        (c) => c.type === 'FOREIGN KEY',
      )

      expect(fkConstraint).toBeDefined()
      expect(fkConstraint?.type).toBe('FOREIGN KEY')
      if (fkConstraint?.type === 'FOREIGN KEY') {
        expect(fkConstraint.columnNames).toContain('user_id')
        expect(fkConstraint.targetTableName).toBe('users')
        expect(fkConstraint.targetColumnNames).toContain('id')
      }
    })

    it('one-to-many relationship', async () => {
      const dbml = `
        Table users {
          id integer [pk]
        }
        
        Table posts {
          id integer [pk]
          user_id integer
        }
        
        Ref: users.id < posts.user_id
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)

      const postsConstraints = value.tables['posts']?.constraints
      const fkConstraint = Object.values(postsConstraints || {}).find(
        (c) => c.type === 'FOREIGN KEY',
      )

      expect(fkConstraint).toBeDefined()
    })

    it('inline relationship', async () => {
      const dbml = `
        Table users {
          id integer [pk]
        }
        
        Table posts {
          id integer [pk]
          user_id integer [ref: > users.id]
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)

      const postsConstraints = value.tables['posts']?.constraints
      const fkConstraint = Object.values(postsConstraints || {}).find(
        (c) => c.type === 'FOREIGN KEY',
      )

      expect(fkConstraint).toBeDefined()
    })

    it('relationship with on delete cascade', async () => {
      const dbml = `
        Table users {
          id integer [pk]
        }
        
        Table posts {
          id integer [pk]
          user_id integer
        }
        
        Ref: posts.user_id > users.id [delete: cascade]
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)

      const postsConstraints = value.tables['posts']?.constraints
      const fkConstraint = Object.values(postsConstraints || {}).find(
        (c) => c.type === 'FOREIGN KEY',
      )

      expect(fkConstraint).toBeDefined()
      if (fkConstraint?.type === 'FOREIGN KEY') {
        expect(fkConstraint.deleteConstraint).toBe('CASCADE')
      }
    })

    it('relationship with on update restrict', async () => {
      const dbml = `
        Table users {
          id integer [pk]
        }
        
        Table posts {
          id integer [pk]
          user_id integer
        }
        
        Ref: posts.user_id > users.id [update: restrict]
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)

      const postsConstraints = value.tables['posts']?.constraints
      const fkConstraint = Object.values(postsConstraints || {}).find(
        (c) => c.type === 'FOREIGN KEY',
      )

      expect(fkConstraint).toBeDefined()
      if (fkConstraint?.type === 'FOREIGN KEY') {
        expect(fkConstraint.updateConstraint).toBe('RESTRICT')
      }
    })
  })

  describe('enums', () => {
    it('should parse enums correctly', async () => {
      const dbml = `
        Enum post_status {
          draft
          published
          archived
        }
        
        Table posts {
          id integer [pk]
          status post_status
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.enums['post_status']).toBeDefined()
      expect(value.enums['post_status']?.values).toEqual([
        'draft',
        'published',
        'archived',
      ])
    })

    it('should handle empty schema without enums', async () => {
      const dbml = `
        Table users {
          id integer [pk]
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)
      expect(value.enums).toEqual({})
    })
  })

  describe('error handling', () => {
    it('should return error for invalid DBML syntax', async () => {
      const dbml = `
        Table users {
          id integer [pk
        }
      `

      const { value, errors } = await processor(dbml)

      expect(errors.length).toBeGreaterThan(0)
      expect(value.tables).toEqual({})
    })
  })

  describe('complex schema', () => {
    it('should parse a complete e-commerce schema', async () => {
      const dbml = `
        Table users {
          id integer [pk]
          email varchar(255) [unique, not null]
          name varchar(100)
          created_at timestamp [default: \`now()\`]
          Note: 'User accounts'
        }
        
        Table products {
          id integer [pk]
          name varchar(255) [not null]
          price decimal(10,2) [not null]
          description text
        }
        
        Table orders {
          id integer [pk]
          user_id integer [not null]
          total decimal(10,2)
          status order_status
          created_at timestamp
        }
        
        Table order_items {
          id integer [pk]
          order_id integer [not null]
          product_id integer [not null]
          quantity integer [not null, default: 1]
          price decimal(10,2) [not null]
        }
        
        Enum order_status {
          pending
          processing
          shipped
          delivered
          cancelled
        }
        
        Ref: orders.user_id > users.id [delete: cascade]
        Ref: order_items.order_id > orders.id [delete: cascade]
        Ref: order_items.product_id > products.id
      `

      const { value, errors } = await processor(dbml)

      expect(errors).toHaveLength(0)

      expect(Object.keys(value.tables)).toHaveLength(4)
      expect(value.tables['users']).toBeDefined()
      expect(value.tables['products']).toBeDefined()
      expect(value.tables['orders']).toBeDefined()
      expect(value.tables['order_items']).toBeDefined()

      expect(value.enums['order_status']).toBeDefined()
      expect(value.enums['order_status']?.values).toHaveLength(5)

      expect(value.tables['users']?.comment).toBe('User accounts')

      const ordersConstraints = value.tables['orders']?.constraints
      const ordersFk = Object.values(ordersConstraints || {}).find(
        (c) => c.type === 'FOREIGN KEY',
      )
      expect(ordersFk).toBeDefined()

      const orderItemsConstraints = value.tables['order_items']?.constraints
      const orderItemsFks = Object.values(orderItemsConstraints || {}).filter(
        (c) => c.type === 'FOREIGN KEY',
      )
      expect(orderItemsFks).toHaveLength(2)
    })
  })
})
