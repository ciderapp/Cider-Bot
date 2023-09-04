use serde_json::Value;

pub trait ValuePath {
    // Prevents us from having to have a hundred line structure for values.
    fn get_value_by_path(&self, path: &str) -> Option<Value>;
    fn get_vec_len_by_path(&self, path: &str) -> Option<usize>;
}

impl ValuePath for Value {
    fn get_value_by_path(&self, path: &str) -> Option<Value> {
        let mut current = self;
        for key in path.split('.') {
            if let Ok(index) = key.parse::<usize>() {
                current = current.get(index)?;
            } else {
                current = current.get(key)?;
            }
        }
        Some(current.clone())
    }

    fn get_vec_len_by_path(&self, path: &str) -> Option<usize> {
        let mut current = self;
        for key in path.split('.') {
            if let Ok(index) = key.parse::<usize>() {
                current = current.get(index)?;
            } else {
                current = current.get(key)?;
            }
        }
        Some(current.as_array().unwrap().len())
    }
}
